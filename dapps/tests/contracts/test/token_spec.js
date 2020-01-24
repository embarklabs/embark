/*global artifacts, describe, config, it*/
const assert = require('assert');
const Token = artifacts.require('Token');
const MyToken = artifacts.require('MyToken');
const MyToken2 = artifacts.require('MyToken2');
const AlreadyDeployedToken = artifacts.require('AlreadyDeployedToken');
const Test = artifacts.require('Test');

config({
  contracts: {
    deploy: {
      ZAMyLib: {},
      SimpleStorage: {
        args: [100]
      },
      AnotherStorage: {
        args: ["$SimpleStorage", "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE"]
      },
      Token: {
        deploy: false,
        args: [1000]
      },
      MyToken: {
        instanceOf: "Token"
      },
      MyToken2: {
        instanceOf: "Token",
        args: [2000]
      },
      AlreadyDeployedToken: {
        address: "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE",
        instanceOf: "Token"
      },
      Test: {
        onDeploy: ["Test.methods.changeAddress('$MyToken').send()"]
      },
      ContractArgs: {
        args: {
          initialValue: 123,
          _addresses: ["$MyToken2", "$SimpleStorage"]
        }
      },
      SomeContract: {
        args: [
          ["$MyToken2", "$SimpleStorage"],
          100
        ]
      }
    }
  }
});

describe("Token", function () {
  this.timeout(0);

  it("not deploy Token", function () {
    assert.strictEqual(Token.address, undefined);
  });

  it("should deploy MyToken and MyToken2", function () {
    assert.ok(MyToken.options.address);
    assert.ok(MyToken2.options.address);
  });

  it("set MyToken Balance correctly", async function () {
    let result = await MyToken.methods._supply().call();
    assert.strictEqual(parseInt(result, 10), 1000);
  });

  it("set MyToken2 Balance correctly", async function () {
    let result = await MyToken2.methods._supply().call();
    assert.strictEqual(parseInt(result, 10), 2000);
  });

  it("get right address", function () {
    assert.strictEqual(AlreadyDeployedToken.options.address.toLowerCase(),
      "0xCAFECAFECAFECAFECAFECAFECAFECAFECAFECAFE".toLowerCase());
  });

  it("should use onDeploy", async function () {
    let result = await Test.methods.addr().call();
    assert.strictEqual(result, MyToken.options.address);
  });
});
