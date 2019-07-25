/*global contract, config, it, web3*/
const assert = require('assert');
const AnotherStorage = require('Embark/contracts/AnotherStorage');
const SimpleStorage = require('Embark/contracts/SimpleStorage');

let accounts;

config({
  blockchain: {
    "accounts": [
      {
        "mnemonic": "example exile argue silk regular smile grass bomb merge arm assist farm",
        balance: "5ether"
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
});

contract("AnotherStorage", function(accountsAgain) {
  const defaultAccount = accounts[0];
  this.timeout(0);

  it("should have got the default account in the describe", function () {
    assert.strictEqual(defaultAccount, accounts[0]);
  });

  it("should have the accounts in the describe callback too", function () {
    assert.deepStrictEqual(accountsAgain, accounts);
  });

  it("should have account with balance", async function() {
    let balance = await web3.eth.getBalance(accounts[0]);
    assert.ok(parseInt(balance, 10) > 4900000000000000000);
    assert.ok(parseInt(balance, 10) <= 5000000000000000000);
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
