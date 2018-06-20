/*global contract, config, it*/
const assert = require('assert');
const PluginStorage = require('Embark/contracts/PluginStorage');
const SimpleStorage = require('Embark/contracts/SimpleStorage');

config({
  contracts: {
    "SimpleStorage": {
      args: [100]
    },
    "PluginStorage": {
      args: ["$SimpleStorage"]
    }
  }
});


contract("PluginSimpleStorage", function () {
  this.timeout(0);

  it("set SimpleStorage address", async function () {
    let result = await PluginStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

});
