describe("Test", function() {
  before(function(done) {
    this.timeout(0);
    var contractsConfig = {
      "Test": {
        "gas": 2000000
      },
      "ZAMyLib2": {
        "deploy": true
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("should call library correctly", function(done) {
    Test2.testAdd(function(err, result) {
      assert.equal(result.toNumber(), 3);
      done();
    });
  });

});
