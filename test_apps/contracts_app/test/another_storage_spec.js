/*global contract, config, it, embark*/
const assert = require('assert');
const AnotherStorage = embark.require('Embark/contracts/AnotherStorage');
const SimpleStorage = embark.require('Embark/contracts/SimpleStorage');

config({
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
