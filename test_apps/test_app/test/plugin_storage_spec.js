/*global contract, before, EmbarkSpec, PluginStorage, SimpleStorage, it*/
const assert = require('assert');

contract("PluginSimpleStorage", function () {
  this.timeout(0);

  before((done) => {
    const contractsConfig = {
      "SimpleStorage": {
        args: [100]
      },
      "PluginStorage": {
        args: ["$SimpleStorage"]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => {
      done();
    });
  });

  it("set SimpleStorage address", async function () {
    let result = await PluginStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

});
