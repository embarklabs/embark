var assert = require('assert');
var Embark = require('embark-framework');
var EmbarkSpec = Embark.initTests();

describe("SimpleStorage", function(done) {
  before(function(done) {
    EmbarkSpec.deployAll(done);
  });

  it("should set constructor value", function(done) {
    SimpleStorage.storedData(function(err, result) {
      assert.equal(result.toNumber(), 100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.set(150, function() {
      SimpleStorage.get(function(err, result) {
        assert.equal(result.toNumber(), 150);
        done();
      });
    });
  });

})
