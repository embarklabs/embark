/*global contract, config, it, assert, before, artifacts*/

const License = artifacts.require('License');
const SNT = artifacts.require('SNT');

let accounts;

const BURN_ADDRESS = "0x0000000000000000000000000000000000000002";

config({
  contracts: {
    deploy: {
      "MiniMeToken": { "deploy": false },
      "MiniMeTokenFactory": {

      },
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
        args: ["$SNT", 10, BURN_ADDRESS]
      }

      /*
      ,
      StakingPool: {
        file: 'staking-pool/contracts/StakingPool.sol',
        args: ["$SNT"]
      }
      */

    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

contract("License", function () {
  before(async () => {
    await SNT.methods.generateTokens(accounts[0], 1000).send();
    await SNT.methods.generateTokens(accounts[2], 1000).send();

  });

  it("should set price on instantiation", async function () {
    const price = await License.methods.price().call();
    assert.strictEqual(parseInt(price, 10), 10);
  });


  it("should not allow to buy license when price is incorrect", async function() {
    try {
      await SNT.methods.approve(License.options.address, 5).send();
      await License.methods.buy().send({from: accounts[0]});
    } catch(error) {
      assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert Unsuccessful token transfer");
    }
  });

  it("should allow to buy license", async function() {
    let isLicenseOwner = await License.methods.isLicenseOwner(accounts[0]).call();
    assert.strictEqual(isLicenseOwner, false);

    await SNT.methods.approve(License.options.address, 0).send({from: accounts[0]}); // Needs to set allowance to 0 first
    await SNT.methods.approve(License.options.address, 10).send({from: accounts[0]});
    await License.methods.buy().send({from: accounts[0]});

    isLicenseOwner = await License.methods.isLicenseOwner(accounts[0]).call();
    assert.strictEqual(isLicenseOwner, true);
    // const stakingBalance = await SNT.methods.balanceOf(StakingPool.options.address).call();
    // FIXME This test doesn't pass even on master
    // assert.strictEqual(stakingBalance, "10", "Contract balance is incorrect");
  });

  it("should buy license with approveAndCall", async () => {
    let isLicenseOwner = await License.methods.isLicenseOwner(accounts[2]).call();
    assert.strictEqual(isLicenseOwner, false);

    const encodedCall = License.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(License.options.address, 10, encodedCall).send({from: accounts[2]});

    isLicenseOwner = await License.methods.isLicenseOwner(accounts[2]).call();
    assert.strictEqual(isLicenseOwner, true);
  });

  it("should not allow to buy license when the address already owns one", async function() {
    try {
      await SNT.methods.approve(License.options.address, 10).send({from: accounts[0]});
      await License.methods.buy().send({from: accounts[0]});
    } catch(error) {
      assert.strictEqual(error.message, "Returned error: VM Exception while processing transaction: revert License already bought");
    }
  });

  it("should not allow to set the price if not the owner", async function() {
    try {
      await License.methods.setPrice(10).send({from: accounts[1]});
    } catch (error) {
      assert.ok(error.message.indexOf('revert') > -1);
    }
  });

  it("should allow to set the price if owner", async function() {
    await License.methods.setPrice(10).send({from: accounts[0]});
    const price = await License.methods.price().call();
    assert.strictEqual(parseInt(price, 10), 10);
  });
});
