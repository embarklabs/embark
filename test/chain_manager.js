var ChainManager = require('../lib/chain_manager.js');
var Config = require('../lib/config/config.js');
var Blockchain = require('../lib/blockchain.js');
var assert = require('assert');
var fs = require('fs');

describe('embark.chain_manager', function() {
  var chainFile = './test/support/chain_manager.json';
  fs.writeFileSync(chainFile, '{}');

  var chainManager = (new ChainManager()).loadConfigFile(chainFile);
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config('development');

  describe('#init', function() {
    chainManager.init('development', blockchainConfig);

    it('should initialize chain', function() {
      var chain = chainManager.chainManagerConfig['0xcd9c11da1e46f86ce40a38b6ef84cfdfa6ea92598a27538f0e87da6d7a5c73d5']
      assert.equal(chain != undefined, true);
    });
  });

  describe('#addContract', function() {

    it('should register a contract in the chain', function() {
      chainManager.addContract("Foo", "123456", [], "0x123");

      console.log(chainManager.chainManagerConfig);
      var chain = chainManager.chainManagerConfig['0xcd9c11da1e46f86ce40a38b6ef84cfdfa6ea92598a27538f0e87da6d7a5c73d5']
      var contract = chain.contracts["d5d91a8825c5c253dff531ddda2354c4014f5699b7bcbea70207cfdcb37b6c8b"]

      assert.equal(contract.name, "Foo");
      assert.equal(contract.address, "0x123");
    });

  });

  describe('#getContract', function() {

    it('should a contract in the chain', function() {
      var contract = chainManager.getContract("Foo", "123456", []);

      assert.equal(contract.name, "Foo");
      assert.equal(contract.address, "0x123");
    });

  });

  describe('#save', function() {

    it('should save changes in the chain', function() {
      chainManager.save();

      var chainFile = './test/support/chain_manager.json';
      var content = fs.readFileSync(chainFile).toString();
      assert.equal(content, '{"0xcd9c11da1e46f86ce40a38b6ef84cfdfa6ea92598a27538f0e87da6d7a5c73d5":{"contracts":{"d5d91a8825c5c253dff531ddda2354c4014f5699b7bcbea70207cfdcb37b6c8b\":{"name":"Foo","address":"0x123"}}}}');
    });

  });

});
