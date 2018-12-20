/*global describe, it, web3, config*/
const assert = require('assert');
const MyToken = require('Embark/contracts/MyToken');
const MyToken2 = require('Embark/contracts/MyToken2');
const EmbarkJS = require('Embark/EmbarkJS');

config({
  contracts: {
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
});

describe("ENS functions", function() {
  it('should allow directives in ENS subdomains', async function() {
    const myTokenAddress = await EmbarkJS.Names.resolve('mytoken.embark.eth');
    assert.strictEqual(MyToken.options.address, myTokenAddress);

    const myToken2Address = await EmbarkJS.Names.resolve('MyToken2.embark.eth');
    assert.strictEqual(MyToken2.options.address, myToken2Address);

    const myTokenName = await EmbarkJS.Names.lookup(MyToken.options.address.toLowerCase());
    assert.strictEqual(myTokenName, 'mytoken.embark.eth');

    const myToken2Name = await EmbarkJS.Names.lookup(MyToken2.options.address.toLowerCase());
    assert.strictEqual(myToken2Name, 'MyToken2.embark.eth');
  });
});

