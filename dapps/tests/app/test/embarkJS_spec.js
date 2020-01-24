/*global artifacts, describe, it, web3, config*/
const assert = require('assert');
const SimpleStorage = artifacts.require('SimpleStorage');
const EmbarkJS = artifacts.require('EmbarkJS');

config({
  namesystem: {
    enabled: true,
    register: {
      "rootDomain": "test.eth"
    }
  },
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      }
    }
  }
});

describe("EmbarkJS functions", function() {
  it('should have access to ENS functions (register, lookup and resolve)', function(done) {
    const registerAddr = web3.utils.toChecksumAddress('0x1a2f3b98e434c02363f3dac3174af93c1d690914');
    EmbarkJS.Names.registerSubDomain('subdomain', registerAddr, async (err) => {
      try {
        assert.strictEqual(err, null);

        const rootAddress = await EmbarkJS.Names.resolve('test.eth');
        assert.strictEqual(rootAddress, web3.eth.defaultAccount);

        const rootName = await EmbarkJS.Names.lookup(rootAddress);
        assert.strictEqual(rootName, 'test.eth');

        const subRegisterAddr = await EmbarkJS.Names.resolve('subdomain.test.eth');
        assert.strictEqual(subRegisterAddr, registerAddr);

        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should have access to Storage functions', async function() {
    // Not calling the functions because it requires Swarm
    assert.ok(EmbarkJS.Storage.saveText);
    assert.ok(EmbarkJS.Storage.get);
  });

  it('should have access to Blockchain functions', async function() {
    const contract = new EmbarkJS.Blockchain.Contract({
      abi: SimpleStorage.options.jsonInterface,
      address: SimpleStorage.options.address,
      web3: web3
    });
    const result = await contract.methods.get().call();
    assert.strictEqual(parseInt(result, 10), 100);
  });
});
