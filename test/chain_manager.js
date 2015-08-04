var ChainManager = require('../lib/chain_manager.js');
var Config = require('../lib/config/config.js');
var Blockchain = require('../lib/blockchain.js');
var assert = require('assert');

describe('embark.chain_manager', function() {
  var chainManager = (new ChainManager()).loadConfigFile('./test/support/chain_manager.json');
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml');

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

});
