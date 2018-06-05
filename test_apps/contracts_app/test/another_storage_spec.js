/*global contract, config, it*/
const assert = require('assert');
import {AnotherStorage, SimpleStorage} from 'Embark/contracts';

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
