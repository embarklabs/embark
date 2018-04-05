contract("Test", function() {
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "Test2": {
      },
      "ZAMyLib": {
      },
      "ZAMyLib2": {
        "deploy": true
      }
    };

    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("should call library correctly", function(done) {
    Test2.methods.testAdd().call().then(function(result) {
      assert.equal(result, 3);
      done();
    });
  });

});
