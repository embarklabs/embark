var assert = require('assert');
//var Embark = require('embark-framework');
var Embark = require('../../lib/index.js');
var EmbarkSpec = Embark.initTests();

describe("SimpleStorage", function() {
  before(function(done) {
    var contractsConfig = {
      "token": {
        args: [1000]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, done);
  });

  it("should get balance", function(done) {
    token.coinBalanceOf(EmbarkSpec.web3.eth.defaultAccount, function(err, result) {
      assert.equal(result.toNumber(), 1000);
      done();
    });
  });

});
