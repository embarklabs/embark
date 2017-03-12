var assert = require('assert');
var Embark = require('embark');
//TODO: this path is temporary to handle the scope of Embark within an app
var EmbarkSpec = require('../node_modules/embark/lib/core/test.js');
var web3 = EmbarkSpec.web3;

describe("AnotherStorage", function() {
  before(function(done) {
    this.timeout(0);
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
    EmbarkSpec.deployAll(contractsConfig, done);
  });

  it("set SimpleStorage address", function(done) {
    AnotherStorage.simpleStorageAddress(function(err, result) {
      assert.equal(result.toString(), SimpleStorage.address);
      done();
    });
  });

});
