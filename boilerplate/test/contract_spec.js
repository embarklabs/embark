var assert = require('assert');
var Embark = require('embark-framework');
var EmbarkSpec = Embark.initTests();
var web3 = EmbarkSpec.web3;

describe("MyContract", function() {
  // Deploy all contrats using the development config
  before(function(done) {
    EmbarkSpec.sim.createAccounts(10, function() {
      EmbarkSpec.sim.setBalance(web3.eth.accounts[0], 1000000000000000000000, function() {
        EmbarkSpec.deployAll(done);
      });
    });
  });

  //it("should set constructor value", function(done) {
  //  SimpleStorage.storedData(function(err, result) {
  //    assert.equal(result.toNumber(), 100);
  //    done();
  //  });
  //});

  //it("set storage value", function(done) {
  //  SimpleStorage.set(150, function() {
  //    SimpleStorage.get(function(err, result) {
  //      assert.equal(result.toNumber(), 150);
  //      done();
  //    });
  //  });
  //});

})

