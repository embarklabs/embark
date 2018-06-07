/*global contract, config, it*/
const assert = require('assert');
const SomeContract = require('Embark/contracts/SomeContract');
const SimpleStorage = require('Embark/contracts/SimpleStorage');
const MyToken2 = require('Embark/contracts/MyToken2');

config({
  contracts: {
    "SimpleStorage": {
      args: [100]
    },
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
        ["$MyToken2", "$SimpleStorage"],
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

  it("set SimpleStorage address", async function() {
    let address = await SomeContract.methods.addr_2().call();
    assert.strictEqual(address, SimpleStorage.options.address);
  });

});

