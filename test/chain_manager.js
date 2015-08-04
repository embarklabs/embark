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
      var chain = chainManager.chainManagerConfig['0x629e768beb87dc8c54a475d310a7196e86c97d0006e5a6d34a8217726c90223f']
      assert.equal(chain != undefined, true);
    });
  });

  describe('#addContract', function() {

    it('should register a contract in the chain', function() {
      chainManager.addContract("Foo", "123456", "0x123");

      var chain = chainManager.chainManagerConfig['0x629e768beb87dc8c54a475d310a7196e86c97d0006e5a6d34a8217726c90223f']
      var contract = chain.contracts["d7190eb194ff9494625514b6d178c87f99c5973e28c398969d2233f2960a573e"]

      assert.equal(contract.name, "Foo");
      assert.equal(contract.address, "0x123");
    });

  });

  describe('#getContract', function() {

    it('should a contract in the chain', function() {
      var contract = chainManager.getContract("123456");

      assert.equal(contract.name, "Foo");
      assert.equal(contract.address, "0x123");
    });

  });

  describe('#save', function() {

    it('should save changes in the chain', function() {
      chainManager.save();

      var chainFile = './test/support/chain_manager.json';
      var content = fs.readFileSync(chainFile).toString();
      assert.equal(content, '{"0x629e768beb87dc8c54a475d310a7196e86c97d0006e5a6d34a8217726c90223f":{"contracts":{"d7190eb194ff9494625514b6d178c87f99c5973e28c398969d2233f2960a573e":{"name":"Foo","address":"0x123"}}}}');
    });

  });

});
