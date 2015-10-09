var EmbarkSpec = require('embark-framework').test;

describe("SimpleStorage", function() {
  beforeAll(function(done) {
    EmbarkSpec(done);
    //SimpleStorage = EmbarkSpec.request("SimpleStorage", [150]);
  });

  it("should set constructor value", function(done) {
    SimpleStorage.storedData(function(err, result) {
      expect(result.toNumber()).toEqual(100);
      done();
    });
  });

  it("set storage value", function(done) {
    SimpleStorage.set(150, function() {
      SimpleStorage.get(function(err, result) {
        console.log(arguments);
        expect(result.toNumber()).toEqual(150);
        done();
      });
    });
  });

})
