/*globals describe, it*/
const Blockchain = require('../lib/modules/blockchain_process/blockchain.js');
const constants = require('../lib/constants.json');
const {defaultHost} = require('../lib/utils/host');

const assert = require('assert');

describe('embark.Blockchain', function() {

  describe('#initializer', function() {

    describe('with empty config', function() {
      it('should have a default config', function(done) {
        let blockchain = new Blockchain({});
        let expectedConfig = {
          networkType: 'custom',
          genesisBlock: false,
          ethereumClientName: 'geth',
          ethereumClientBin: 'geth',
          datadir: false,
          mineWhenNeeded: false,
          rpcHost: defaultHost,
          rpcPort: 8545,
          rpcApi: ['eth', 'web3', 'net', 'debug'],
          rpcCorsDomain: false,
          networkId: 1337,
          port: 30303,
          nodiscover: false,
          maxpeers: 25,
          mine: false,
          vmdebug: false,
          whisper: true,
          account: {},
          devPassword: "",
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug", "pubsub"],
          wsHost: defaultHost,
          wsOrigins: false,
          wsPort: 8546,
          wsRPC: true,
          targetGasLimit: false,
          syncMode: undefined,
          verbosity: undefined,
          proxy: true,
          silent: undefined          
        };
        // We check also proxy's ports because proxy is set to true
        expectedConfig.wsPort += constants.blockchain.servicePortOnProxy;
        expectedConfig.rpcPort += constants.blockchain.servicePortOnProxy;

        assert.deepEqual(blockchain.config, expectedConfig);
        done();
      });
    });

    describe('with config', function() {
      it('should take config params', function(done) {
        let config = {
          networkType: 'livenet',
          genesisBlock: 'foo/bar/genesis.json',
          ethereumClientName: 'parity',
          ethereumClientBin: 'parity',
          datadir: '/foo/datadir/',
          mineWhenNeeded: true,
          rpcHost: defaultHost,
          rpcPort: 12345,
          rpcApi: ['eth', 'web3', 'net', 'debug'],
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          vmdebug: false,
          whisper: false,
          account: {},
          devPassword: "foo/bar/devpassword",
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug"],
          wsHost: defaultHost,
          wsOrigins: false,
          wsPort: 12346,
          wsRPC: true,
          targetGasLimit: false,
          syncMode: undefined,
          verbosity: undefined,
          proxy: true
        };
        let blockchain = new Blockchain(config);

        let expectedConfig = {
          networkType: 'livenet',
          genesisBlock: 'foo/bar/genesis.json',
          ethereumClientName: 'parity',
          ethereumClientBin: 'parity',
          datadir: '/foo/datadir/',
          mineWhenNeeded: true,
          rpcHost: defaultHost,
          rpcPort: 12345,
          rpcApi: ['eth', 'web3', 'net', 'debug'],
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          vmdebug: false,
          whisper: false,
          account: {},
          devPassword: "foo/bar/devpassword",
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug"],
          wsHost: defaultHost,
          wsOrigins: false,
          wsPort: 12346,
          wsRPC: true,
          targetGasLimit: false,
          syncMode: undefined,
          verbosity: undefined,
          proxy: true,
          silent: undefined
        };
        // We check also proxy's ports because proxy is set to true
        expectedConfig.wsPort += constants.blockchain.servicePortOnProxy;
        expectedConfig.rpcPort += constants.blockchain.servicePortOnProxy;

        assert.deepEqual(blockchain.config, expectedConfig);
        done();
      });
    });

  });
});
