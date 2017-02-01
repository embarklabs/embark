/*globals describe, it*/
var Blockchain = require('../lib/blockchain.js');
var assert = require('assert');

describe('embark.Blockchain', function() {
  //var Client = function() {};
  //Client.prototype.name = "ClientName";

  describe('#initializer', function() {
    //var client = new Client();

    describe('with empty config', function() {
      it('should have a default config', function() {
        var config = {
          networkType: 'custom',
          genesisBlock: false,
          datadir: false,
          mineWhenNeeded: false,
          rpcHost: 'localhost',
          rpcPort: 8545,
          rpcCorsDomain: false,
          networkId: 12301,
          port: 30303,
          nodiscover: false,
          maxpeers: 25,
          mine: false,
          whisper: true,
          account: {}
        };
        var blockchain = Blockchain(config, 'geth');

        assert.deepEqual(blockchain.config, config);
      });
    });

    describe('with config', function() {
      it('should take config params', function() {
        var config = {
          networkType: 'livenet',
          genesisBlock: 'foo/bar/genesis.json',
          datadir: '/foo/datadir/',
          mineWhenNeeded: true,
          rpcHost: 'someserver',
          rpcPort: 12345,
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          whisper: false,
          account: {}
        };
        var blockchain = Blockchain(config, 'geth');

        assert.deepEqual(blockchain.config, config);
      });
    });

  });
});
