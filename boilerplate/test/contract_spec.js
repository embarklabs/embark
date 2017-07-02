// describe("SimpleStorage", function() {
//  before(function(done) {
//    this.timeout(0);
//    var contractsConfig = {
//      "SimpleStorage": {
//        args: [100, '0x123']
//      }
//    };
//    EmbarkSpec.deployAll(contractsConfig, done);
//  });
//
//  it("should set constructor value", function(done) {
//    SimpleStorage.storedData(function(err, result) {
//      assert.equal(result.toNumber(), 100);
//      done();
//    });
//  });
//
//  it("set storage value", function(done) {
//    SimpleStorage.set(150, function() {
//      SimpleStorage.get(function(err, result) {
//        assert.equal(result.toNumber(), 150);
//        done();
//      });
//    });
//  });
//
// });
