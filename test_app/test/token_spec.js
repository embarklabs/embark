var assert = require('assert');
var Embark = require('embark');
var EmbarkSpec = Embark.initTests();
var web3 = EmbarkSpec.web3;

describe("Token", function() {
  before(function(done) {
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
      },
      "AlreadyDeployedToken": {
        "address": "0x123",
        instanceOf: "Token"
      }
    };
    EmbarkSpec.deployAll(contractsConfig, done);
  });

  it("not deploy Token", function(done) {
    assert.equal(Token.address, "undefined");
    done();
  });

  it("not deploy MyToken and MyToken2", function(done) {
    assert.notEqual(MyToken.address, "undefined");
    assert.notEqual(MyToken2.address, "undefined");
    done();
  });

  it("set MyToken Balance correctly", function(done) {
      MyToken._supply(function(err, result) {
        assert.equal(result.toNumber(), 1000);
        done();
      });
  });

  it("set MyToken2 Balance correctly", function(done) {
      MyToken2._supply(function(err, result) {
        assert.equal(result.toNumber(), 2000);
        done();
      });
  });

  it("get right address", function(done) {
    assert.equal(AlreadyDeployedToken.address, "0x123");
    done();
  });

});
