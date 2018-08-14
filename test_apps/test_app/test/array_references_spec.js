/*global contract, config, it, web3*/
const assert = require('assert');
const SomeContract = require('Embark/contracts/SomeContract');
const MyToken2 = require('Embark/contracts/MyToken2');

config({
  contracts: {
    "Token": {
      deploy: false,
      args: [1000]
    },
    "MyToken2": {
      instanceOf: "Token",
      args: [2000]
    },
    "SomeContract": {
      "args": [
        ["$MyToken2", "$accounts[0]"],
        100
      ]
    }
  }
});

contract("SomeContract", function() {
  this.timeout(0);

  it("set MyToken2 address", async function() {
    let address = await SomeContract.methods.addr_1().call();
    assert.strictEqual(address, MyToken2.options.address);
  });

  it("set account address", async function() {
    let address = await SomeContract.methods.addr_2().call();
    assert.strictEqual(address, web3.eth.defaultAccount);
  });

});

