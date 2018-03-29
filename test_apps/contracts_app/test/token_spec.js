
describe("Token", function() {

  this.timeout(0);
  before(function(done) {
    this.timeout(0);

    //config({
    //  node: "http://localhost:8545"
    //});

    var contractsConfig = {
      "ZAMyLib": {
      },
      "Token": {
      },
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
        "address": "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE",
        instanceOf: "Token"
      },
      "Test": {
        onDeploy: [
          "Test.methods.changeAddress('$MyToken').send()"
        ]
      },
      "ContractArgs": {
        "args": {
          "initialValue": 123,
          "_addresses": ["$MyToken2", "$SimpleStorage"]
        }
      },
      "SomeContract": {
        "args": [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      }
    };
    EmbarkSpec.deployAll(contractsConfig, () => { done() });
  });

  it("not deploy Token", function(done) {
    assert.equal(Token.address, "");
    done();
  });

  it("not deploy MyToken and MyToken2", function(done) {
    assert.notEqual(MyToken.address, "");
    assert.notEqual(MyToken2.address, "");
    done();
  });

  it("set MyToken Balance correctly", function(done) {
    MyToken.methods._supply().call().then(function(result) {
      assert.equal(result, 1000);
      done();
    });
  });

  it("set MyToken2 Balance correctly", function(done) {
    MyToken2.methods._supply().call().then(function(result) {
      assert.equal(result, 2000);
      done();
    });
  });

  it("get right address", function(done) {
    assert.equal(AlreadyDeployedToken.address, "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE");
    done();
  });

  it("should use onDeploy", function(done) {
    Test.methods.addr().call().then(function(result) {
      assert.equal(result, MyToken.address)
      done();
    });
  });

});
