contract("AnotherStorage", function() {
  this.timeout(0);
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage"]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("set SimpleStorage address", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

});
