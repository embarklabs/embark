/*global contract, config, it*/
const assert = require('assert');
const AnotherStorage = require('Embark/contracts/AnotherStorage');

config({
  contracts: {
    AnotherStorage: {
      args: ['$ERC20']
    }
  }
});


contract("AnotherStorageWithInterface", function() {
  this.timeout(0);

  it("sets an empty address because ERC20 is an interface", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), '0x0000000000000000000000000000000000000000');
  });
});

