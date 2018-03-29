//describe("SimpleStorage", function() {
//  this.timeout(0);
//  before(function(done) {
//    this.timeout(0);
//    var contractsConfig = {
//      "SimpleStorage": {
//        args: [100]
//      }
//    };
//    EmbarkSpec.deployAll(contractsConfig, () => { done() });
//  });
//
//  it("should set constructor value", function(done) {
//    SimpleStorage.methods.storedData().call().then(function(result) {
//      assert.equal(result, 100);
//      done();
//    });
//  });
//
//  it("set storage value", function(done) {
//    SimpleStorage.methods.set(150).send().then(function() {
//      SimpleStorage.methods.get().call().then(function(result) {
//        assert.equal(result, 150);
//        done();
//      });
//    });
//  });
//
//});
