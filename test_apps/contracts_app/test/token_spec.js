
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

  it("not deploy Token", function() {
    assert.equal(Token.address, "");
  });

  it("not deploy MyToken and MyToken2", function() {
    assert.notEqual(MyToken.address, "");
    assert.notEqual(MyToken2.address, "");
  });

  it("set MyToken Balance correctly", async function() {
    let result = await MyToken.methods._supply().call();
    assert.equal(result, 1000);
  });

  it("set MyToken2 Balance correctly", async function() {
    let result = await MyToken2.methods._supply().call();
    assert.equal(result, 2000);
  });

  it("get right address", function() {
    assert.equal(AlreadyDeployedToken.address, "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE");
  });

  it("should use onDeploy", async function() {
    let result = await Test.methods.addr().call();
    assert.equal(result, MyToken.address)
  });

});
