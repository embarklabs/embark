/*global contract, config, it, assert, before, web3, artifacts*/
/* eslint require-atomic-updates:0, no-await-in-loop:0*/

const ArbitrationLicense = artifacts.require('ArbitrationLicense');

const SNT = artifacts.require('SNT');
const UserStore = artifacts.require('UserStore');
const OfferStore = artifacts.require('OfferStore');

const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

const CONTACT_DATA = "Status:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

let accounts;

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
      ArbitrationLicense: {
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
      Medianizer: {

      },
      OfferStore: {
        args: ["$UserStore", "$SellerLicense", "$ArbitrationLicense", BURN_ADDRESS, "$Medianizer"],
        onDeploy: ["UserStore.methods.setAllowedContract('$OfferStore', true).send()"]
      }
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

let hash, signature;

contract("MetadataStore", function () {
  before(async () => {
    await SNT.methods.generateTokens(accounts[0], 1000).send();
    await SNT.methods.generateTokens(accounts[9], 1000).send();

    const encodedCall = ArbitrationLicense.methods.buy().encodeABI();

    await SNT.methods.approveAndCall(ArbitrationLicense.options.address, 10, encodedCall).send({from: accounts[9]});

    await ArbitrationLicense.methods.changeAcceptAny(true).send({from: accounts[9]});

    hash = await UserStore.methods.getDataHash("Iuri", CONTACT_DATA).call();
    signature = await web3.eth.sign(hash, accounts[0]);
  });

  it("should allow to add new user and offer", async function () {
    const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, accounts[9]).send({value: amountToStake});

    const offersSize = await OfferStore.methods.offersSize().call();
    assert.strictEqual(offersSize, '1');

    const userInfo = await UserStore.methods.users(accounts[0]).call();
    assert.strictEqual(userInfo.username, "Iuri");
  });

  it("should allow to add new offer only when already a user", async function () {
    const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "EUR", "Iuri", [0], 0, 0, 1, accounts[9]).send({value: amountToStake});
    const offersSize = await OfferStore.methods.offersSize().call();
    assert.strictEqual(offersSize, '2');

    const offerIds = await OfferStore.methods.getOfferIds(accounts[0]).call();
    assert.strictEqual(offerIds.length, 2);
  });

  it("should allow to add new offer when margin is more than 100", async function () {
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 101, accounts[9]).send({value: amountToStake});

      const offerIds = await OfferStore.methods.getOfferIds(accounts[0]).call();
      assert.strictEqual(offerIds.length, 3);
  });

  it("should allow to update a user", async function () {
    await UserStore.methods.addOrUpdateUser(CONTACT_DATA, "Montreal", "Anthony").send();
    const user = await UserStore.methods.users(accounts[0]).call();
    assert.strictEqual(user.location, 'Montreal');
    assert.strictEqual(user.username, 'Anthony');
  });

  it("should allow to update a user using a signature", async function () {
    hash = await UserStore.methods.getDataHash("Anthony", CONTACT_DATA).call();
    signature = await web3.eth.sign(hash, accounts[0]);
    let nonce = await UserStore.methods.user_nonce(accounts[0]).call();

    await UserStore.methods.addOrUpdateUser(signature, CONTACT_DATA, "Quebec", "Anthony", nonce).send();
    const user = await UserStore.methods.users(accounts[0]).call();
    assert.strictEqual(user.location, 'Quebec');
  });

  it("should allow to delete an offer", async function () {
    const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
    const receipt = await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "EUR", "Iuri", [0], 0, 0, 1, accounts[9]).send({value: amountToStake});
    const offerAdded = receipt.events.OfferAdded;
    const offerId = offerAdded.returnValues.offerId;

    const receipt2 = await OfferStore.methods.removeOffer(offerId).send();
    const offerRemoved = receipt2.events.OfferRemoved;
    assert(!!offerRemoved, "OfferRemoved() not triggered");
    assert.strictEqual(offerRemoved.returnValues.owner, accounts[0], "Invalid seller");
    assert.strictEqual(offerRemoved.returnValues.offerId, offerId, "Invalid offer");
  });

  it("should not allow adding more than 10 offers", async function () {

    let offerCount = await OfferStore.methods.offerCnt(accounts[0]).call();
    let offerId;
    for(let i = 0; i < 10 - offerCount; i++){
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      const receipt = await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, accounts[9]).send({value: amountToStake});
      const offerAdded = receipt.events.OfferAdded;
      offerId = offerAdded.returnValues.offerId;
    }

    try {
      const amountToStake = await OfferStore.methods.getAmountToStake(accounts[0]).call();
      await OfferStore.methods.addOffer(SNT.address, CONTACT_DATA, "London", "USD", "Iuri", [0], 0, 0, 1, accounts[9]).send({value: amountToStake});
      assert.fail('should have reverted before');
    } catch (error) {
      assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Exceeds the max number of offers");
    }

    await OfferStore.methods.removeOffer(offerId).send();

    offerCount = await OfferStore.methods.offerCnt(accounts[0]).call();
    assert.strictEqual(offerCount, '9');
  });
});
