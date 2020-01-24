/*global artifacts, contract, config, it, web3*/
const assert = require('assert');
const AnotherStorage = artifacts.require('AnotherStorage');
const SimpleStorage = artifacts.require('SimpleStorage');

let accounts, defaultAccount;
const numAddresses = 10;

config({
  blockchain: {
    "accounts": [
      {
        "mnemonic": "example exile argue silk regular smile grass bomb merge arm assist farm",
        balance: "5ether",
        numAddresses: 10
      }
    ]
  },
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage"]
      }
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
  defaultAccount = accounts[0];
});

contract("AnotherStorage", function() {
  this.timeout(0);

  it("should have got the default account in the describe", function () {
    assert.strictEqual(defaultAccount, accounts[0]);
  });

  it("should have account with balance", async function() {
    const balance = await web3.eth.getBalance(accounts[0]);
    assert.ok(parseInt(balance, 10) > 4900000000000000000);
    assert.ok(parseInt(balance, 10) <= 5000000000000000000);
  });

  it("should have the right balance for all other accounts ", async function() {
    let balance;

    for (let i = 1; i < numAddresses - 3; i++) {
      balance = await web3.eth.getBalance(accounts[i]);
      console.log('Account', i , balance);
      assert.strictEqual(parseInt(balance, 10), 5000000000000000000, `Account ${i} doesn't have the balance set`);
    }
  });

  it("set SimpleStorage address", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

  it("set SimpleStorage address with alternative syntax", async function() {
    let result = await AnotherStorage.simpleStorageAddress();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });
});
