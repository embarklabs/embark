/*global contract, config, it, assert, web3, before, describe, artifacts*/
/* eslint require-atomic-updates:0, no-await-in-loop:0*/
const TestUtils = require("../utils/testUtils");

const ArbitrationLicense = artifacts.require('ArbitrationLicense');
const OfferStore = artifacts.require('OfferStore');
const UserStore = artifacts.require('UserStore');
const Escrow = artifacts.require('Escrow');
const SNT = artifacts.require('SNT');

const ARBITRATION_SOLVED_SELLER = 2;

let accounts;
let arbitrator, blacklistedAccount;

const feePercent = 1;
const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

const CONTACT_DATA = "Status:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

config({
  blockchain: {
    accounts: [
      {
        mnemonic: "foster gesture flock merge beach plate dish view friend leave drink valley shield list enemy",
        balance: "5 ether",
        numAddresses: "10"
      }
    ]
  },
  contracts: {
    deploy: {
      "MiniMeToken": {"deploy": false},
      "MiniMeTokenFactory": {},
      "Medianizer": {},
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
      ArbitrationLicense: {
        args: ["$SNT", 10, BURN_ADDRESS]
      },
      SellerLicense: {
        instanceOf: "License",
        args: ["$SNT", 10, BURN_ADDRESS]
      },

      /*
      StakingPool: {
        file: 'staking-pool/contracts/StakingPool.sol',
        args: ["$SNT"]
      },
      */

      UserStore: {
        args: ["$SellerLicense", "$ArbitrationLicense"]
      },
      OfferStore: {
        args: ["$UserStore", "$SellerLicense", "$ArbitrationLicense", BURN_ADDRESS, "$Medianizer"],
        onDeploy: ["UserStore.methods.setAllowedContract('$OfferStore', true).send()"]
      },
      Escrow: {
        args: ["$accounts[0]", "0x0000000000000000000000000000000000000000", "$ArbitrationLicense", "$OfferStore", "$UserStore", BURN_ADDRESS, feePercent * 1000],
        onDeploy: [
          "OfferStore.methods.setAllowedContract('$Escrow', true).send()",
          "UserStore.methods.setAllowedContract('$Escrow', true).send()"
        ]
      },
      StandardToken: {}
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
  arbitrator = accounts[8];
  blacklistedAccount = accounts[5];
});

contract("Escrow", function() {

  const tradeAmount = 100;
  const feeAmount = Math.round(tradeAmount * (feePercent / 100));

  let receipt, escrowId, ethOfferId, hash, signature, nonce;
  let created;
  let offerIds = [];

  this.timeout(0);

  before(async () => {
    await SNT.methods.generateTokens(accounts[0], 1000).send();
    await SNT.methods.generateTokens(blacklistedAccount, 1000).send();

    // Register arbitrators
    await SNT.methods.generateTokens(arbitrator, 1000).send();

    const encodedCall2 = ArbitrationLicense.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall2).send({from: arbitrator});
    await ArbitrationLicense.methods.changeAcceptAny(true).send({from: arbitrator});
    await ArbitrationLicense.methods.blacklistSeller(blacklistedAccount).send({from: arbitrator});
  });

  describe("Offer Stake", async() => {

    it("base price should be ~1usd", async() => {
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      // Medianizer for this example has a value of "161567500000000000000", 161.5675 usd per eth
      const oneUsd = (1 / 161.5675).toFixed(6);
      const amountToStakeUsd = parseFloat(web3.utils.fromWei(amountToStake, "ether")).toFixed(6);
      assert.strictEqual(oneUsd, amountToStakeUsd);
    });

    it("price for each offers should increase exponentially", async() => {
      let amountToStake;

      // 1st to 4th offer
      for(let i = 0; i < 4; i++){
        amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
        assert.strictEqual(amountToStake, "6189000000000000");
        receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
        offerIds.push(receipt.events.OfferAdded.returnValues.offerId);
      }

      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "9101470588235294");

      receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      offerIds.push(receipt.events.OfferAdded.returnValues.offerId);

      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "13106117647058823");

      receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      offerIds.push(receipt.events.OfferAdded.returnValues.offerId);

      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "17838882352941176");

      receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      offerIds.push(receipt.events.OfferAdded.returnValues.offerId);
    });

    it("price should decrease for each offer exponentially", async() => {
      let currOffer, amountToStake;

      currOffer = offerIds.pop();
      await OfferStore.methods.removeOffer(currOffer).send();
      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "17838882352941176");

      currOffer = offerIds.pop();
      await OfferStore.methods.removeOffer(currOffer).send();
      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "13106117647058823");

      currOffer = offerIds.pop();
      await OfferStore.methods.removeOffer(currOffer).send();
      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "9101470588235294");

      for(let i = 0; i < 3; i++){
        currOffer = offerIds.pop();
        await OfferStore.methods.removeOffer(currOffer).send();
        amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
        assert.strictEqual(amountToStake, "6189000000000000");
      }
    });

    it("deleting an offer should refund the stake", async() => {
      let contractBalance, userBalance1, userBalance2;

      ethOfferId = offerIds.pop();

      userBalance1 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
      contractBalance = await web3.eth.getBalance(OfferStore.options.address);
      assert.strictEqual(contractBalance, "6189000000000000");

      receipt = await OfferStore.methods.removeOffer(ethOfferId).send();
      contractBalance = await web3.eth.getBalance(OfferStore.options.address);
      assert.strictEqual(contractBalance, web3.utils.toWei("0", "ether"));

      userBalance2 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));

      assert(userBalance1.lt(userBalance2), "User balance did not increase after refund");
    });

    it("price for each offers should keep increasing exponentially", async() => {
      let amountToStake;

      // 1st to 4th offer
      for(let i = 0; i < 4; i++){
        amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
        assert.strictEqual(amountToStake, "6189000000000000");
        receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      }

      amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "9101470588235294");
    });

    it("releasing an escrow should refund the stake and decrease next offer price", async() => {
      let userBalance1, userBalance2;

      // Create Offer
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "9101470588235294");

      receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      ethOfferId = receipt.events.OfferAdded.returnValues.offerId;

      userBalance1 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));

      // Create Escrow
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U").send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;

      // Fund Escrow
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      // Release Escrow
      receipt = await Escrow.methods.release(escrowId).send({from: accounts[0]});

      userBalance2 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
      assert(userBalance1.lt(userBalance2), "User balance did not increase after refund");

      const stakeDetails = await OfferStore.methods.stakes(ethOfferId).call();
      assert.strictEqual(stakeDetails.amount, "0");
    });

    it("price for next offer should not increase", async() => {
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      assert.strictEqual(amountToStake, "9101470588235294");
    });

    it("winning a dispute should not release the stake (only succesful trades do)", async() => {
      let initialContractBalance, finalContractBalance;

      // Create Offer
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      receipt = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
      ethOfferId = receipt.events.OfferAdded.returnValues.offerId;

      initialContractBalance = await web3.eth.getBalance(OfferStore.options.address);

      // Create Escrow
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;

      // Fund Escrow
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      // Pay Escrow
      await Escrow.methods.pay(escrowId).send({from: accounts[1]});

      // Open dispute
      await Escrow.methods.openCase(escrowId, '1').send({from: accounts[1]});

      // Seller wins dispute
      receipt = await Escrow.methods.setArbitrationResult(escrowId, ARBITRATION_SOLVED_SELLER).send({from: arbitrator});

      finalContractBalance = await web3.eth.getBalance(OfferStore.options.address);
      assert.strictEqual(finalContractBalance, initialContractBalance);
    });
  });

});
