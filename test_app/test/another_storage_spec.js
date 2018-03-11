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

  it("set SimpleStorage address", function(done) {
    AnotherStorage.methods.simpleStorageAddress().call().then(function(result) {
      assert.equal(result.toString(), SimpleStorage.options.address);
      done();
    });
  });

});
