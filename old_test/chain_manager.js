var ChainManager = require('../lib/chain_manager.js');
var Config = require('../lib/config/config.js');
var Blockchain = require('../lib/blockchain.js');
var assert = require('assert');
var fs = require('fs');

// TODO: replace with ethersim
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8101"));

describe('embark.chain_manager', function() {
  var chainFile = './test/support/chain_manager.json';
  fs.writeFileSync(chainFile, '{}');

  var chainManager = (new ChainManager()).loadConfigFile(chainFile);
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config('development');

  describe('#init', function() {
    chainManager.init('development', blockchainConfig, web3);

    it('should initialize chain', function() {
      var chain = chainManager.chainManagerConfig['0x245a1b878a79ee9d0fd46e19c89d0cefbaa475e74e45fa133e022da45943b111']
      assert.equal(chain != undefined, true);
    });
  });

  describe('#addContract', function() {

    it('should register a contract in the chain', function() {
      chainManager.addContract("Foo", "123456", [], "0x123");

      console.log(chainManager.chainManagerConfig);
      var chain = chainManager.chainManagerConfig['0x245a1b878a79ee9d0fd46e19c89d0cefbaa475e74e45fa133e022da45943b111']
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
      assert.equal(content, '{"0x245a1b878a79ee9d0fd46e19c89d0cefbaa475e74e45fa133e022da45943b111\":{"contracts":{"d5d91a8825c5c253dff531ddda2354c4014f5699b7bcbea70207cfdcb37b6c8b\":{"name":"Foo","address":"0x123"}}}}');
    });

  });

});
