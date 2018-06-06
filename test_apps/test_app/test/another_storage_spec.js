/*global contract, config, it, embark*/
const assert = require('assert');
const AnotherStorage = embark.require('Embark/contracts/AnotherStorage');
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');

config({
  deployment: {
    "accounts": [
      {
        "mnemonic": "example exile argue silk regular smile grass bomb merge arm assist farm"
      }
    ]
  },
  contracts: {
    "SimpleStorage": {
      args: [100]
    },
    "AnotherStorage": {
      args: ["$SimpleStorage"]
    }
  }
});

contract("AnotherStorage", function() {
  this.timeout(0);

  it("set SimpleStorage address", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });
});
