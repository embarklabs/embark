/*global describe, it, web3, config*/
const assert = require('assert');
const SimpleStorage = require('Embark/contracts/SimpleStorage');
const EmbarkJS = require('Embark/EmbarkJS');

config({
  contracts: {
    "SimpleStorage": {
      args: [100]
    }
  }
});

describe("EmbarkJS functions", function() {
  it('should have access to ENS functions', async function() {
    const rootAddress = await EmbarkJS.Names.resolve('embark.eth');
    assert.strictEqual(rootAddress, web3.eth.defaultAccount);

    const rootName = await EmbarkJS.Names.lookup(rootAddress);
    assert.strictEqual(rootName, 'embark.eth');
  });

  it('should have access to Storage functions', async function() {
    // Not calling the functions because it requires Swarm
    assert.ok(EmbarkJS.Storage.saveText);
    assert.ok(EmbarkJS.Storage.get);
  });

  it('should have access to Blockchain functions', async function() {
    const contract = new EmbarkJS.Blockchain.Contract({abi: SimpleStorage.options.jsonInterface, address: SimpleStorage.options.address, web3: web3});
    const result = await contract.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });
});

