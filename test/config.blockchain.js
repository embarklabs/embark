var Config = require('../lib/config/config.js');
var assert = require('assert');

describe('embark.config.blockchain', function() {
  var blockchainConfig = new Config.Blockchain();

  describe('#loadConfigFile', function() {
    it('should read and load yml file', function() {
      blockchainConfig.loadConfigFile('test/support/blockchain.yml');

      assert.equal(blockchainConfig.blockchainConfig.hasOwnProperty('development'), true)
      assert.equal(blockchainConfig.blockchainConfig.hasOwnProperty('staging'), true)
    });

    it('should throw exception reading invalid file', function() {
      assert.throws(function() { blockchainConfig.loadConfigFile('test/support/invalid.yml') }, Error);
    });
  });

  describe('#loadConfig', function() {
    it('should load config', function() {
      var hsh = {
        development: {},
        staging: {}
      };

      blockchainConfig.loadConfig(hsh);

      assert.equal(blockchainConfig.blockchainConfig.hasOwnProperty('development'), true)
      assert.equal(blockchainConfig.blockchainConfig.hasOwnProperty('staging'), true)
    });
  });

  describe('#config', function() {

    it('should load environment', function() {
      var hsh = {
        development: {
          rpc_host: 'localhost',
          rpc_port: 8101,
          rpc_whitelist: "*",
          network_id: 0,
          minerthreads: 1,
          genesis_block: 'config/genesis.json',
          datadir: '/tmp/embark',
          chains: 'chains_development.json',
          deploy_timeout: 45,
          mine_when_needed: true,
          gas_limit: 123,
          gas_price: 100,
          console: false,
          account: {
            init: true,
            password: 'config/password'
          }
        },
        staging: {}
      };

      blockchainConfig.loadConfig(hsh);

      assert.deepEqual(blockchainConfig.config('development'), {
        rpcHost: 'localhost',
        rpcPort: 8101,
        gasLimit: 123,
        gasPrice: 100,
        rpcWhitelist: "*",
        testnet: false,
        bootNodes: [],
        whisper: false,
        minerthreads: 1,
        nat: [],
        genesisBlock: 'config/genesis.json',
        datadir: '/tmp/embark',
        chains: 'chains_development.json',
        deployTimeout: 45,
        deploy_synchronously: false,
        networkId: 0,
        maxPeers: 4,
        mine: false,
        port: "30303",
        console_toggle: false,
        mine_when_needed: true,
        geth_extra_opts: [],
        account: {
          init: true,
          password: 'config/password'
        }
      })
    });

    it('should return defaults', function() {
      var hsh = {
        development: {
          rpc_host: 'localhost',
          rpc_port: 8101,
          rpc_whitelist: "*",
          network_id: 0,
          minerthreads: 1,
          datadir: '/tmp/embark',
          chains: undefined,
          mine_when_needed: true,
          console: false,
          account: {
            init: true,
            password: 'config/password'
          },
        },
        staging: {}
      };

      blockchainConfig.loadConfig(hsh);

      assert.deepEqual(blockchainConfig.config('development'), {
        rpcHost: 'localhost',
        rpcPort: 8101,
        gasLimit: 500000,
        gasPrice: 10000000000000,
        rpcWhitelist: "*",
        testnet: false,
        bootNodes: [],
        whisper: false,
        minerthreads: 1,
        nat: [],
        genesisBlock: undefined,
        datadir: '/tmp/embark',
        chains: undefined,
        deployTimeout: 20,
        deploy_synchronously: false,
        networkId: 0,
        maxPeers: 4,
        mine: false,
        port: "30303",
        console_toggle: false,
        mine_when_needed: true,
        geth_extra_opts: [],
        account: {
          init: true,
          password: 'config/password'
        }
      })
    });

    it('should load environment', function() {
      var blockchainConfig = new Config.Blockchain();
      assert.throws(function() { blockchainConfig.config('development') }, Error);
    });
  });

});
