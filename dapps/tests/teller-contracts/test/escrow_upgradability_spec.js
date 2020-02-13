/*global contract, config, it, assert, web3, before, describe, artifacts*/
const TestUtils = require("../utils/testUtils");
const EscrowInstance = artifacts.require('EscrowInstance');
const ArbitrationLicense = artifacts.require('ArbitrationLicense');
const SNT = artifacts.require('SNT');
const UserStore = artifacts.require('UserStore');
const OfferStore = artifacts.require('OfferStore');
const TestEscrowUpgrade = artifacts.require('TestEscrowUpgrade');

const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

const CONTACT_DATA = "Status:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";


let accounts, arbitrator;
let receipt;
let ethOfferId;

config({
  contracts: {
    deploy: {
      "MiniMeToken": {"deploy": false},
      "MiniMeTokenFactory": {},
      "SNT": {
        "instanceOf": "MiniMeToken",
        "args": [
          "$MiniMeTokenFactory",
          "0x0000000000000000000000000000000000000000",
          0,
          "TestMiniMeToken",
          18,
          "STT",
          true
        ]
      },
      License: {
        deploy: false
      },
      SellerLicense: {
        instanceOf: "License",
        args: ["$SNT", 10, BURN_ADDRESS]
      },
      UserStore: {
        args: ["$SellerLicense", "$ArbitrationLicense"]
      },
      Medianizer: {

      },
      OfferStore: {
        args: ["$UserStore", "$SellerLicense", "$ArbitrationLicense", BURN_ADDRESS, "$Medianizer"],
        onDeploy: ["UserStore.methods.setAllowedContract('$OfferStore', true).send()"]
      },
      ArbitrationLicense: {
        args: ["$SNT", 10, BURN_ADDRESS]
      },

      /*
      StakingPool: {
        file: 'staking-pool/contracts/StakingPool.sol',
        args: ["$SNT"]
      },
      */

      Escrow: {
        args: ["$accounts[0]", "0x0000000000000000000000000000000000000002", "$ArbitrationLicense", "$OfferStore", "$UserStore", BURN_ADDRESS, 1000]
      },
      Proxy: {
        deploy: false
      },
      EscrowInstance: {
        instanceOf: "Proxy",
        proxyFor: "Escrow",
        args: ["0x", "$Escrow"]
      },

      TestEscrowUpgrade: {
        args: ["$accounts[0]", "0x0000000000000000000000000000000000000002", "$ArbitrationLicense", "$OfferStore", "$UserStore", BURN_ADDRESS, 1000]
      },
      StandardToken: {}
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
  arbitrator = accounts[8];
});

contract("Escrow", function() {
  this.timeout(0);

  describe("Upgradeable Escrows", async () => {

    before(async () => {
      await UserStore.methods.setAllowedContract(EscrowInstance.options.address, true).send();

      await OfferStore.methods.setAllowedContract(EscrowInstance.options.address, true).send();


      await SNT.methods.generateTokens(accounts[0], 1000).send();
      await SNT.methods.generateTokens(arbitrator, 1000).send();
      const encodedCall2 = ArbitrationLicense.methods.buy().encodeABI();
      await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall2).send({from: arbitrator});
      await ArbitrationLicense.methods.changeAcceptAny(true).send({from: arbitrator});
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      receipt  = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      ethOfferId = receipt.events.OfferAdded.returnValues.offerId;
    });


    it("Can create initial escrow version", async () => {

      // Here we are setting the initial "template" by calling the init() function
      EscrowInstance.methods.init(
        accounts[0],
        ArbitrationLicense.options.address, // random address for the relay
        ArbitrationLicense.options.address,
        OfferStore.options.address,
        UserStore.options.address,
        "0x0000000000000000000000000000000000000002", // TODO: replace by StakingPool address
        1000
      ).send({from: accounts[0]});

    });

    it("Can create an escrow", async () => {
      receipt = await EscrowInstance.methods.createEscrow(ethOfferId, 123, 140, accounts[1], CONTACT_DATA, "L", "U").send({from: accounts[1]});
      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");
      assert.strictEqual(created.returnValues.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(created.returnValues.buyer, accounts[1], "Invalid buyer");
    });

    it("Can create an escrow using a signature", async () => {
      const hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      const signature = await web3.eth.sign(hash, accounts[1]);
      const nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await EscrowInstance.methods.createEscrow(ethOfferId, 123, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");
      assert.strictEqual(created.returnValues.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(created.returnValues.buyer, accounts[1], "Invalid buyer");
    });

    it("Can upgrade contract", async () => {
      receipt = await EscrowInstance.methods.updateCode(TestEscrowUpgrade.options.address).send();
      // eslint-disable-next-line
      TestEscrowUpgrade.options.address = EscrowInstance.options.address;
    });

    it("Can call new contract functions", async () => {
      const val = 5;
      await TestEscrowUpgrade.methods.setVal(val).send();
      const currentVal = await TestEscrowUpgrade.methods.getVal().call();
      assert.strictEqual(val.toString(), currentVal.toString());
    });
  });
});
