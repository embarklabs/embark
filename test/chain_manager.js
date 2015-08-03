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
      assert.equal(chainManager.chainManagerConfig['0x629e768beb87dc8c54a475d310a7196e86c97d0006e5a6d34a8217726c90223f'] != undefined, true);
      assert.equal(chainManager.chainManagerConfig['0x629e768beb87dc8c54a475d310a7196e86c97d0006e5a6d34a8217726c90223f'].contracts.length, 0);
    });

  });
});
