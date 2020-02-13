/*global contract, config, it, assert, web3, before, describe, beforeEach, increaseTime, artifacts*/
/* eslint require-atomic-updates:0, no-await-in-loop:0*/
const TestUtils = require("../utils/testUtils");

const ArbitrationLicense = artifacts.require('ArbitrationLicense');
const UserStore = artifacts.require('UserStore');
const OfferStore = artifacts.require('OfferStore');
const Escrow = artifacts.require('Escrow');
const StandardToken = artifacts.require('StandardToken');
const SNT = artifacts.require('SNT');

const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

const CONTACT_DATA = "Status:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const ESCROW_CREATED = '0';
const ESCROW_FUNDED = '1';
const ESCROW_RELEASED = '3';
const ESCROW_CANCELED = '4';

let accounts;
let arbitrator, arbitrator2;

const feePercent = 1;

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
      ArbitrationLicense: {
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
      Escrow: {
        args: ["$accounts[0]", "0x0000000000000000000000000000000000000000", "$ArbitrationLicense", "$OfferStore", "$UserStore", BURN_ADDRESS, feePercent * 1000]
      },
      StandardToken: {}
    }
  }
}, (_err, web3_accounts) => {
  web3.eth.defaultAccount = web3_accounts[0];
  accounts = web3_accounts;
  arbitrator = accounts[8];
  arbitrator2 = accounts[9];
});

contract("Escrow", function() {

  const {toBN} = web3.utils;

  const tradeAmount = 1000000;
  const feeAmount = Math.round(tradeAmount * (feePercent / 100));

  // util
  const expireTransaction = async() => {
    const addTime = 5 * 86400;
    try {
      await increaseTime(addTime + 1);
    } catch (e) {
      console.error('Error with the increase time', e);
    }
  };

  let receipt, escrowId, escrowTokenId, sntOfferId, ethOfferId, tokenOfferId, hash, signature, nonce;
  let created;

  this.timeout(0);

  before(async () => {
    await OfferStore.methods.setAllowedContract(Escrow.options.address, true).send();
    await UserStore.methods.setAllowedContract(Escrow.options.address, true).send();

    await SNT.methods.generateTokens(accounts[0], 1000).send();

    // Register arbitrators
    await SNT.methods.generateTokens(arbitrator, 1000).send();
    await SNT.methods.generateTokens(arbitrator2, 1000).send();

    const encodedCall2 = ArbitrationLicense.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall2).send({from: arbitrator});
    await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall2).send({from: arbitrator2});

    await ArbitrationLicense.methods.changeAcceptAny(true).send({from: arbitrator});
    await ArbitrationLicense.methods.changeAcceptAny(true).send({from: arbitrator2});

    let amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(TestUtils.zeroAddress, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    ethOfferId = receipt.events.OfferAdded.returnValues.offerId;

    amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(StandardToken.options.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    tokenOfferId = receipt.events.OfferAdded.returnValues.offerId;

    amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    receipt  = await OfferStore.methods.addOffer(SNT.options.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, arbitrator).send({from: accounts[0], value: amountToStake});
    sntOfferId = receipt.events.OfferAdded.returnValues.offerId;
  });

  describe("Creating a new escrow", async () => {
    it("Buyer can create escrow", async () => {
      receipt = await Escrow.methods.createEscrow(ethOfferId, 123, 140, accounts[1], CONTACT_DATA, "L", "Username").send({from: accounts[1]});

      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");
      assert.strictEqual(created.returnValues.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(created.returnValues.buyer, accounts[1], "Invalid buyer");
    });

    it("Buyer can create escrow using signature", async () => {
      hash = await UserStore.methods.getDataHash("Username", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(ethOfferId, 123, 140, accounts[1], CONTACT_DATA, "L", "Username", nonce, signature).send({from: accounts[1]});

      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");
      assert.strictEqual(created.returnValues.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(created.returnValues.buyer, accounts[1], "Invalid buyer");
    });

    it("Seller should be able to create escrows", async () => {
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(ethOfferId, 123, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[0]});

      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");

      assert.strictEqual(created.returnValues.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(created.returnValues.buyer, accounts[1], "Invalid buyer");
      escrowId = created.returnValues.escrowId;
    });

    it("Created escrow should contain valid data", async () => {
      const escrow = await Escrow.methods.transactions(escrowId).call();

      assert.strictEqual(escrow.offerId, ethOfferId, "Invalid offerId");
      assert.strictEqual(escrow.buyer, accounts[1], "Invalid buyer");
      assert.strictEqual(escrow.tokenAmount, "123", "Invalid trade amount");
      assert.strictEqual(escrow.status, ESCROW_CREATED, "Invalid status");
    });

    it("Seller should be able to fund escrow", async () => {
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[0], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[0]});
      escrowId = receipt.events.Created.returnValues.escrowId;

      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});
      const funded = receipt.events.Funded;
      assert(!!funded, "Funded() not triggered");
    });

    it("Funded escrow should contain valid data", async () => {
      const ethFeeBalance = await Escrow.methods.feeTokenBalances(TestUtils.zeroAddress).call();
      assert.strictEqual(parseInt(ethFeeBalance, 10), feeAmount, 'Invalid fee balance');
      const contractBalance = await web3.eth.getBalance(Escrow.options.address);
      assert.strictEqual(parseInt(contractBalance, 10), feeAmount + tradeAmount, "Invalid contract balance");
      const escrow = await Escrow.methods.transactions(escrowId).call();
      assert.strictEqual(parseInt(escrow.tokenAmount, 10), tradeAmount, "Invalid amount");
      assert.strictEqual(escrow.status, ESCROW_FUNDED, "Invalid status");
    });

    it("Escrows can be created with ERC20 tokens", async () => {
      await StandardToken.methods.mint(accounts[0], tradeAmount + feeAmount).send();

      const balanceBeforeCreation = await StandardToken.methods.balanceOf(accounts[0]).call();

      await StandardToken.methods.approve(Escrow.options.address, tradeAmount + feeAmount).send({from: accounts[0]});
      const allowance = await StandardToken.methods.allowance(accounts[0], Escrow.options.address).call();
      assert(allowance >= tradeAmount + feeAmount, "Allowance needs to be equal or higher to the amount plus the fee");

      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      receipt = await Escrow.methods.createEscrow(tokenOfferId, tradeAmount, 140, accounts[0], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[0]});
      const created = receipt.events.Created;
      assert(!!created, "Created() not triggered");
      escrowTokenId = receipt.events.Created.returnValues.escrowId;

      receipt = await Escrow.methods.fund(escrowTokenId).send({from: accounts[0]});
      const funded = receipt.events.Funded;
      assert(!!funded, "Funded() not triggered");

      const balanceAfterCreation = await StandardToken.methods.balanceOf(accounts[0]).call();

      assert(toBN(balanceAfterCreation), toBN(balanceBeforeCreation).sub(toBN(tradeAmount)), "Token value wasn't deducted");

      const contractBalance = await StandardToken.methods.balanceOf(Escrow.options.address).call();

      assert(toBN(contractBalance), toBN(tradeAmount), "Contract token balance is incorrect");

      const escrow = await Escrow.methods.transactions(escrowTokenId).call();

      assert.strictEqual(parseInt(escrow.tokenAmount, 10), tradeAmount, "Invalid amount");
    });

    it("Can fund an SNT escrow with approveAndCall", async () => {
      await SNT.methods.approve(Escrow.options.address, 0).send({from: accounts[0]});

      await SNT.methods.generateTokens(accounts[0], tradeAmount + feeAmount).send();

      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();

      let receipt = await Escrow.methods.createEscrow(sntOfferId, tradeAmount, 140, accounts[0], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[0]});
      escrowTokenId = receipt.events.Created.returnValues.escrowId;


      SNT.options.jsonInterface.push(Escrow.options.jsonInterface.find(x => x.name === 'Funded'));
      const encodedCall = Escrow.methods.fund(escrowTokenId).encodeABI();
      receipt = await SNT.methods.approveAndCall(Escrow.options.address, tradeAmount + feeAmount, encodedCall).send({from: accounts[0]});

      const funded = receipt.events.Funded;
      assert(!!funded, "Funded() not triggered");

    });
  });


  describe("Canceling an escrow", async () => {
    it("A seller cannot cancel an unexpired funded escrow", async () => {
      // Create and Fund
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createAndFund(ethOfferId, tradeAmount, 140, CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[0], value: tradeAmount + feeAmount});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Can only be canceled after expiration");
      }
    });

    it("A seller can cancel their ETH escrows", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      await expireTransaction();

      receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});

      let Canceled = receipt.events.Canceled;
      assert(!!Canceled, "Canceled() not triggered");

      let escrow = await Escrow.methods.transactions(escrowId).call();
      assert.strictEqual(escrow.status, ESCROW_CANCELED, "Should have been canceled");
    });

    it("A seller can cancel their expired token escrows and gets back the fee", async () => {
      await StandardToken.methods.mint(accounts[0], tradeAmount + feeAmount).send();
      await StandardToken.methods.approve(Escrow.options.address, tradeAmount + feeAmount).send({from: accounts[0]});

      const balanceBeforeCreation = await StandardToken.methods.balanceOf(accounts[0]).call();
      const contractBalanceBeforeCreation = await StandardToken.methods.balanceOf(Escrow.options.address).call();

      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(tokenOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowTokenId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowTokenId).send({from: accounts[0]});

      await expireTransaction();

      await Escrow.methods.cancel(escrowTokenId).send({from: accounts[0]});

      const balanceAfterCancelation = await StandardToken.methods.balanceOf(accounts[0]).call();
      const contractBalanceAfterCancelation = await StandardToken.methods.balanceOf(Escrow.options.address).call();

      let escrow = await Escrow.methods.transactions(escrowTokenId).call();

      assert.strictEqual(escrow.status, ESCROW_CANCELED, "Should have been canceled");
      assert.strictEqual(balanceBeforeCreation, balanceAfterCancelation, "Invalid seller balance");
      assert.strictEqual(contractBalanceBeforeCreation, contractBalanceAfterCancelation, "Invalid contract balance");
    });

    it("A buyer can cancel an escrow that hasn't been funded yet", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[1]});
      let Canceled = receipt.events.Canceled;
      assert(!!Canceled, "Canceled() not triggered");
    });

    it("A buyer can cancel an escrow that has been funded", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[1]});
      let Canceled = receipt.events.Canceled;
      assert(!!Canceled, "Canceled() not triggered");
    });

    it("An escrow can only be canceled once", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      await expireTransaction();
      receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only transactions in created or funded state can be canceled");
      }
    });

    it("Accounts different from the escrow owner cannot cancel escrows", async() => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[2]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only participants can invoke this function");
      }
    });

    it("A seller cannot cancel an escrow marked as paid", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      receipt = await Escrow.methods.pay(escrowId).send({from: accounts[1]});

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only transactions in created or funded state can be canceled");
      }
    });
  });


  describe("Releasing escrows", async () => {
    beforeEach(async() => {
      await StandardToken.methods.mint(accounts[0], tradeAmount + feeAmount).send();

      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});
    });

    it("An invalid escrow cannot be released", async() => {
      try {
        await Escrow.methods.release(999).send({from: accounts[0]}); // Invalid escrow
        assert.fail('should have reverted before');
      } catch (error) {
        TestUtils.assertJump(error);
      }
    });

    it("Accounts different from the seller cannot release an escrow", async () => {
      try {
        await Escrow.methods.release(escrowId).send({from: accounts[1]}); // Buyer tries to release
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only the seller can invoke this function");
      }
    });

    it("Escrow owner can release his funds to the buyer", async () => {
      const buyerBalanceBeforeEscrow = await web3.eth.getBalance(accounts[1]);
      receipt = await Escrow.methods.release(escrowId).send({from: accounts[0]});
      const buyerBalanceAfterEscrow = await web3.eth.getBalance(accounts[1]);

      const released = receipt.events.Released;
      assert(!!released, "Released() not triggered");

      const escrow = await Escrow.methods.transactions(escrowId).call();
      assert.strictEqual(escrow.status, ESCROW_RELEASED, "Should have been released");
      assert.strictEqual(toBN(escrow.tokenAmount).add(toBN(buyerBalanceBeforeEscrow)).toString(), buyerBalanceAfterEscrow.toString(), "Invalid buyer balance");
    });

    it("Escrow owner can release token funds to the buyer", async () => {
      await StandardToken.methods.approve(Escrow.options.address, tradeAmount + feeAmount).send({from: accounts[0]});

      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(tokenOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowTokenId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowTokenId).send({from: accounts[0]});

      const buyerBalanceBeforeEscrow = await StandardToken.methods.balanceOf(accounts[1]).call();
      const contractBalanceBeforeEscrow = await StandardToken.methods.balanceOf(Escrow.options.address).call();

      const escrow = await Escrow.methods.transactions(escrowTokenId).call();

      receipt = await Escrow.methods.release(escrowTokenId).send({from: accounts[0]});
      const buyerBalanceAfterEscrow = await StandardToken.methods.balanceOf(accounts[1]).call();
      const contractBalanceAfterEscrow = await StandardToken.methods.balanceOf(Escrow.options.address).call();

      assert.strictEqual(toBN(escrow.tokenAmount).add(toBN(buyerBalanceBeforeEscrow)).toString(), buyerBalanceAfterEscrow.toString(), "Invalid buyer balance");
      const after = toBN(contractBalanceBeforeEscrow).sub(toBN(tradeAmount).add(toBN(feeAmount)));
      assert.strictEqual(contractBalanceAfterEscrow.toString(), after.toString(), "Invalid contract balance");
    });

    it("Escrow funds can be released to different destinations", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[7], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});


      const buyerBalanceBeforeEscrow = await web3.eth.getBalance(accounts[7]);
      const escrow = await Escrow.methods.transactions(escrowId).call();
      receipt = await Escrow.methods.release(escrowId).send({from: accounts[0]});
      const buyerBalanceAfterEscrow = await web3.eth.getBalance(accounts[7]);

      assert.equal(toBN(escrow.tokenAmount).add(toBN(buyerBalanceBeforeEscrow)).toString(), buyerBalanceAfterEscrow, "Invalid buyer balance");
    });

    it("Released escrow cannot be released again", async() => {
      await Escrow.methods.release(escrowId).send({from: accounts[0]});

      try {
        receipt = await Escrow.methods.release(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Invalid transaction status");
      }
    });

    it("Released escrow cannot be canceled", async() => {
      await Escrow.methods.release(escrowId).send({from: accounts[0]});

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only transactions in created or funded state can be canceled");
      }
    });

    it("Canceled escrow cannot be released", async() => {
      await expireTransaction();

      await Escrow.methods.cancel(escrowId).send({from: accounts[0]});

      try {
        receipt = await Escrow.methods.release(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Invalid transaction status");
      }
    });
  });


  describe("Buyer notifies payment of escrow", async () => {
    beforeEach(async() => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});
    });

    it("A random account should not be able to mark a transaction as paid", async () => {
      try {
        receipt = await Escrow.methods.pay(escrowId).send({from: accounts[7]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only the buyer can invoke this function");
      }
    });

    it("A buyer should be able to mark an escrow transaction as paid", async () => {
      receipt = await Escrow.methods.pay(escrowId).send({from: accounts[1]});
      const paid = receipt.events.Paid;
      assert(!!paid, "Paid() not triggered");
      assert.strictEqual(paid.returnValues.escrowId, escrowId, "Invalid escrow id");
    });

    it("Anyone should be able to mark an escrow transaction as paid on behalf of the buyer", async () => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      escrowId = receipt.events.Created.returnValues.escrowId;

      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      const messageToSign = await Escrow.methods.paySignHash(escrowId).call();
      signature = await web3.eth.sign(messageToSign, accounts[1]);

      receipt = await Escrow.methods['pay(uint256,bytes)'](escrowId, signature).send({from: accounts[9]});

      const paid = receipt.events.Paid;
      assert(!!paid, "Paid() not triggered");
      assert.strictEqual(paid.returnValues.escrowId, escrowId, "Invalid escrowId");
    });

    it("A seller cannot cancel paid escrows", async () => {
      receipt = await Escrow.methods.pay(escrowId).send({from: accounts[1]});

      await expireTransaction();

      try {
        receipt = await Escrow.methods.cancel(escrowId).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch (error) {
        assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Only transactions in created or funded state can be canceled");
      }
    });
  });

  describe("Rating a released Transaction", async() => {
    beforeEach(async() => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      await Escrow.methods.release(escrowId).send({from: accounts[0]});
    });

    it("should not allow a score that's less than 1", async() => {
      try {
        await Escrow.methods.rateTransaction(escrowId, 0).send({from: accounts[1]});
        assert.fail('should have reverted: should not allow a score last less than 1');
      } catch(error) {
        TestUtils.assertJump(error);
        assert.ok(error.message.indexOf('Rating needs to be at least 1') >= 0);
      }
    });

    it("should not allow a score to be more than 5", async() => {
      try {
        await Escrow.methods.rateTransaction(escrowId, 6).send({from: accounts[1]});
        assert.fail('should have reverted: should not allow a score to be more than 5');
      } catch(error) {
        TestUtils.assertJump(error);
        assert.ok(error.message.indexOf('Rating needs to be at less than or equal to 5'));
      }
    });

    for(let i=1; i<=5; i++) {
      it("should allow a score of " + i, async() => {
        await Escrow.methods.rateTransaction(escrowId, i).send({from: accounts[1]});
        const transaction = await Escrow.methods.transactions(escrowId).call();
        assert.strictEqual(transaction.sellerRating, i.toString());
      });
    }

    it("should only allow rating once", async() => {
      await Escrow.methods.rateTransaction(escrowId, 3).send({from: accounts[1]});
      let transaction = await Escrow.methods.transactions(escrowId).call();
      assert.strictEqual(transaction.sellerRating, "3");

      try {
        await Escrow.methods.rateTransaction(escrowId, 2).send({from: accounts[1]});
      } catch(error) {
        TestUtils.assertJump(error);
        assert.ok(error.message.indexOf('Transaction already rated') >= 0);
      }
    });

    it("should allow the buyer to rate the transaction", async() => {
      receipt = await Escrow.methods.rateTransaction(escrowId, 4).send({from: accounts[0]});
    });

    it("should allow the seller to rate the transaction", async() => {
      receipt = await Escrow.methods.rateTransaction(escrowId, 4).send({from: accounts[1]});
    });

    it("should not allow a random account to rate the transaction", async() => {
      try {
        receipt = await Escrow.methods.rateTransaction(escrowId, 4).send({from: accounts[5]});
        assert.fail('should have reverted: should only allow the buyer to rate the transaction');
      } catch(error) {
        TestUtils.assertJump(error);
        assert.ok(error.message.indexOf('Only participants can invoke this function') >= 0);
      }
    });
  });

  describe("Rating an unreleased Transaction", async() => {
    let receipt, created, escrowId;

    beforeEach(async() => {
      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});
    });

    it("should not allow rating an unreleased transaction", async() => {
      try {
        await Escrow.methods.rateTransaction(escrowId, 4).send({from: accounts[0]});
        assert.fail('should have reverted: should not allow a score last less than 1');
      } catch(error) {
        TestUtils.assertJump(error);
        assert.ok(error.message.indexOf('Transaction not completed yet') >= 0);
      }
    });
  });

  describe("Getting a user rating", async() => {
    let receipt, created, escrowId, seller;

    beforeEach(async() => {
      seller = accounts[0];
      for (let i = 1; i <= 5; i++) {
        let buyer = accounts[i];
        let rating = i;
        const isPaused = await Escrow.methods.paused().call();
        if (isPaused) {
          receipt = await Escrow.methods.unpause().send({from: seller});
        }

        // Create
        hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: buyer});
        signature = await web3.eth.sign(hash, buyer);
        nonce = await UserStore.methods.user_nonce(buyer).call();
        receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: buyer});
        created = receipt.events.Created;
        escrowId = created.returnValues.escrowId;
        // Fund
        receipt = await Escrow.methods.fund(escrowId).send({from: seller, value: tradeAmount + feeAmount});

        await Escrow.methods.release(escrowId).send({from: seller});
        await Escrow.methods.rateTransaction(escrowId, rating).send({from: buyer});
      }
    });

    it("should calculate the user rating", async() => {
      const arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
      const events = await Escrow.getPastEvents('Rating', {fromBlock: 1, filter: {seller}});

      let ratings = events.slice(events.length - 5).map((e) => parseInt(e.returnValues.rating, 10));
      assert.strictEqual(arrAvg(ratings), 3, "The seller rating is not correct");
    });
  });

   describe("Escrow fees", async() => {
    it("fee balance should increase with escrow funding", async() => {
      const ethFeeBalanceBefore = await Escrow.methods.feeTokenBalances(TestUtils.zeroAddress).call();
      const totalEthBefore = await web3.eth.getBalance(Escrow.options.address);

      // Create
      hash = await UserStore.methods.getDataHash("U", CONTACT_DATA).call({from: accounts[1]});
      signature = await web3.eth.sign(hash, accounts[1]);
      nonce = await UserStore.methods.user_nonce(accounts[1]).call();
      receipt = await Escrow.methods.createEscrow(ethOfferId, tradeAmount, 140, accounts[1], CONTACT_DATA, "L", "U", nonce, signature).send({from: accounts[1]});
      created = receipt.events.Created;
      escrowId = created.returnValues.escrowId;
      // Fund
      receipt = await Escrow.methods.fund(escrowId).send({from: accounts[0], value: tradeAmount + feeAmount});

      const ethFeeBalance = await Escrow.methods.feeTokenBalances(TestUtils.zeroAddress).call();
      const totalEthAfter = await web3.eth.getBalance(Escrow.options.address);

      assert.strictEqual(parseInt(ethFeeBalance, 10), parseInt(ethFeeBalanceBefore, 10) + feeAmount, "Fee balance did not increase");
      assert.strictEqual(parseInt(totalEthAfter, 10), parseInt(totalEthBefore, 10) + feeAmount + tradeAmount, "Total balance did not increase");
    });
  });
});
