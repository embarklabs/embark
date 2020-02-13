/*global contract, config, it, web3, before, describe, beforeEach, artifacts*/
/* eslint require-atomic-updates:0, no-await-in-loop:0*/
const TestUtils = require("../utils/testUtils");

const UserStore = artifacts.require('UserStore');
const OfferStore = artifacts.require('OfferStore');
const ArbitrationLicense = artifacts.require('ArbitrationLicense');
const Escrow = artifacts.require('Escrow');
const StandardToken = artifacts.require('StandardToken');
const SNT = artifacts.require('SNT');

const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

const CONTACT_DATA = "Status:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

let accounts;
const fundAmount = 100;

const feePercent = 1;
const feeAmount = Math.round(fundAmount * (feePercent / 100));

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
        args: ["$accounts[0]", "0x0000000000000000000000000000000000000002", "$ArbitrationLicense", "$OfferStore", "$UserStore", BURN_ADDRESS, feePercent * 1000]
      },
      StandardToken: {}
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

function sequentialPromiseExec(tasks) {
  return tasks.reduce((p, task) => p.then(task), Promise.resolve());
}

contract("Escrow Funding", function() {
  const {toBN} = web3.utils;
  const value = fundAmount + feeAmount;

  let receipt, escrowId, ethOfferId, tokenOfferId, SNTOfferId, arbitrator;

  this.timeout(0);

  before(async () => {
    await StandardToken.methods.mint(accounts[0], 100000000).send();
    await SNT.methods.generateTokens(accounts[0], 100000000).send();

    // Register arbitrators
    arbitrator = accounts[9];
    await SNT.methods.generateTokens(arbitrator, 1000).send();
    const encodedCall2 = ArbitrationLicense.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall2).send({from: arbitrator});

    await ArbitrationLicense.methods.changeAcceptAny(true).send({from: arbitrator});

    let amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    ethOfferId = receipt.events.OfferAdded.returnValues.offerId;

    amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(StandardToken.options.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    tokenOfferId = receipt.events.OfferAdded.returnValues.offerId;

    amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(SNT.options.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    SNTOfferId = receipt.events.OfferAdded.returnValues.offerId;
  });

  describe("ETH as asset", async () => {
    beforeEach(async () => {

      const hash = await UserStore.methods.getDataHash("Iuri", CONTACT_DATA).call({from: accounts[1]});
      const nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      const signature = await web3.eth.sign(hash, accounts[1]);

      receipt = await Escrow.methods.createEscrow(ethOfferId, fundAmount, 140, accounts[1], CONTACT_DATA, "U", "Iuri", nonce, signature)
                                    .send({from: accounts[0]});

      escrowId = receipt.events.Created.returnValues.escrowId;
    });

    it("Should fund escrow and deduct an SNT fee", async () => {
      // Still requires 2 transactions, because approveAndCall cannot send ETH
      // TODO: test if inside the contract we can encode the call, and call approveAndCall

      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value});
    });
  });

  describe("Tokens as Asset", async () => {
    let escrowIdSNT, escrowIdToken;

    beforeEach(async () => {
      // Reset allowance
      await SNT.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});
      await StandardToken.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});

      let hash = await UserStore.methods.getDataHash("Iuri", CONTACT_DATA).call({from: accounts[1]});
      let signature = await web3.eth.sign(hash, accounts[1]);
      let nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(SNTOfferId, fundAmount, 140, accounts[1], CONTACT_DATA, "U", "Iuri", nonce,  signature)
                                    .send({from: accounts[0]});
      escrowIdSNT = receipt.events.Created.returnValues.escrowId;

      hash = await UserStore.methods.getDataHash("Iuri", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(tokenOfferId, fundAmount, 140, accounts[1], CONTACT_DATA, "U", "Iuri", nonce, signature)
                                    .send({from: accounts[0]});
      escrowIdToken = receipt.events.Created.returnValues.escrowId;
    });

    const execute = async (token, escrowId) => {
      const {approvalPromises, trxToSend} = await tokenApprovalAndBuildTrx(token, escrowId);
      await sequentialPromiseExec(approvalPromises);
      await trxToSend.send({from: accounts[0]});
    };

    it("Allowance == to funds and fee. Token is SNT", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).toString(10);
      await SNT.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});

      await execute(SNT, escrowIdSNT);
    });

    it("Allowance > to funds and fee. Token is SNT", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(100)).toString(10);
      await SNT.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});

      await execute(SNT, escrowIdSNT);
    });

    it("Allowance < than funds and fee. Token is SNT", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).sub(toBN(10)).toString(10);
      await SNT.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});

      await execute(SNT, escrowIdSNT);
    });

    it("Allowance == to required funds. Token is not SNT. SNT Allowance == required Fees", async () => {
      await StandardToken.methods.approve(Escrow.options.address, fundAmount + feeAmount).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance > to required funds. Token is not SNT. SNT Allowance == required Fees", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(100)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance < to required funds. Token is not SNT. SNT Allowance == required Fees", async () => {
      const amount = toBN(fundAmount).sub(toBN(10)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance == to required funds. Token is not SNT. SNT Allowance > required Fees", async () => {
      await StandardToken.methods.approve(Escrow.options.address, fundAmount + feeAmount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1000).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance > to required funds. Token is not SNT. SNT Allowance > required Fees", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(100)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1000).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance < to required funds. Token is not SNT. SNT Allowance > required Fees", async () => {
      const amount = toBN(fundAmount).sub(toBN(10)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1000).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance == to required funds. Token is not SNT. SNT Allowance < required Fees", async () => {
      await StandardToken.methods.approve(Escrow.options.address, fundAmount + feeAmount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance > to required funds. Token is not SNT. SNT Allowance < required Fees", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(100)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    it("Allowance < to required funds. Token is not SNT. SNT Allowance < required Fees", async () => {
      const amount = toBN(fundAmount).sub(toBN(10)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await SNT.methods.approve(Escrow.options.address, 1).send({from: accounts[0]});

      await execute(StandardToken, escrowIdToken);
    });

    const tokenApprovalAndBuildTrx = async (token, escrowId) => {
      const tokenAllowance = await token.methods.allowance(accounts[0], Escrow.options.address).call();

      const toSend = Escrow.methods.fund(escrowId);
      // const encodedCall = toSend.encodeABI();

      let approvalPromises = [];
      let trxToSend;

      const resetApproval = (token, tokenAllowance) => {
        // Reset approval
        // due to: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        if(toBN(tokenAllowance).gt(toBN(0))){
          approvalPromises.push(token.methods.approve(Escrow.options.address, "0").send({from: accounts[0]}));
        }
      };

      // Verifying token allowance for funding
      if (toBN(tokenAllowance).lt(toBN(fundAmount))) {
        resetApproval(token, tokenAllowance);
        approvalPromises.push(token.methods.approve(Escrow.options.address, fundAmount + feeAmount).send({from: accounts[0]}));
      }

      trxToSend = toSend; // Enough funds. Execute directly.

      return {approvalPromises, trxToSend};
    };
  });

});
