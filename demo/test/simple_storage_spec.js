var assert = require('assert');
//var Embark = require('embark-framework');

var SimpleStorage;

describe("SimpleStorage", function() {
  before(function(done) {
    var self = this;

    var Embark = require('../../lib/index.js');
    var EmbarkSpec = Embark.initTests();
    //var web3 = EmbarkSpec.web3;

    //var contracts = EmbarkSpec.deployAll(done);
    //var SimpleStorage = contracts.SimpleStorage;
    // or
    EmbarkSpec.deployContract('SimpleStorage', [100], function(contract) {
      SimpleStorage = contract;
      done();
    });
  });

  it("should set constructor value", function(done) {
    SimpleStorage.storedData()
    .then(function(value) {
      assert.equal(value.toNumber(), 100);
      done();
    });
  });

  it("set storage value", function(done) {
    var self = this;
    //console.log(SimpleStorage);
    SimpleStorage.set(150)
    .then(function() {
      return SimpleStorage.get();
    })
    .then(function(value) {
        assert.equal(value.toNumber(), 150);
        done();
    });
  });

});
