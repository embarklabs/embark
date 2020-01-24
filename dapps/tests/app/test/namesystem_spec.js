/*global artifacts, describe, it, config*/
const assert = require('assert');
const MyToken = artifacts.require('MyToken');
const MyToken2 = artifacts.require('MyToken2');
const EmbarkJS = artifacts.require('EmbarkJS');

let accounts;

config({
  namesystem: {
    enabled: true,
    "register": {
      "rootDomain": "embark.eth",
      "subdomains": {
        "mytoken": "$MyToken",
        "MyToken2": "$MyToken2",
        "account": "$accounts[0]"
      }
    }
  },
  contracts: {
    deploy: {
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
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

describe("ENS functions", function() {
  it('should allow directives in ENS subdomains', async function() {
    const myTokenAddress = await EmbarkJS.Names.resolve('mytoken.embark.eth');
    assert.strictEqual(myTokenAddress, MyToken.options.address);

    const myToken2Address = await EmbarkJS.Names.resolve('MyToken2.embark.eth');
    assert.strictEqual(myToken2Address, MyToken2.options.address);

    const accountAddress = await EmbarkJS.Names.resolve('account.embark.eth');
    assert.strictEqual(accountAddress, accounts[0]);

    const myTokenName = await EmbarkJS.Names.lookup(MyToken.options.address.toLowerCase());
    assert.strictEqual(myTokenName, 'mytoken.embark.eth');

    const myToken2Name = await EmbarkJS.Names.lookup(MyToken2.options.address.toLowerCase());
    assert.strictEqual(myToken2Name, 'MyToken2.embark.eth');
  });
});
