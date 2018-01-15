
contract("SimpleStorage", function() {

  this.timeout(0);
  before(function(done) {
    this.timeout(0);

    config({
      node: "http://localhost:8545"
    });

    var contractsConfig = {
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage"]
      },
      "Token": {
        deploy: false,
        args: [1000]
      },
      "MyToken": {
        instanceOf: "Token"
      },
      "MyToken2": {
        instanceOf: "Token",
        args: [2000]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("should set constructor value", function(done) {
    SimpleStorage.methods.storedData().call().then(function(result) {
      assert.equal(result, 100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.methods.set(150).send().then(function() {
      SimpleStorage.methods.get().call().then(function(result) {
        assert.equal(result, 499650);
        done();
      });
    });
  });

});
