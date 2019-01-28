/*globals describe, it*/
const Blockchain = require('../lib/modules/blockchain_process/blockchain.js');
const constants = require('../lib/constants.json');
const {defaultHost} = require('../lib/utils/host');
const path = require('path');
const fs = require('../lib/core/fs.js');

const assert = require('assert');

describe('embark.Blockchain', function() {

  describe('#initializer', function() {

    describe('with empty config', function() {
      it('should have a default config', function(done) {
        const blockchain = new Blockchain({});
        const expectedConfig = {
          networkType: 'custom',
          genesisBlock: false,
          ethereumClientName: 'geth',
          ethereumClientBin: 'geth',
          datadir: fs.dappPath(".embark/development/datadir"),
          mineWhenNeeded: false,
          rpcHost: defaultHost,
          rpcPort: 8545,
          rpcApi: ['eth', 'web3', 'net', 'debug', "personal"],
          rpcCorsDomain: "http://localhost:8000",
          networkId: 1337,
          port: 30303,
          nodiscover: false,
          maxpeers: 25,
          mine: false,
          vmdebug: false,
          whisper: true,
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug", "pubsub", "personal"],
          wsHost: defaultHost,
          wsOrigins: "http://localhost:8000",
          wsPort: 8546,
          wsRPC: true,
          targetGasLimit: 8000000,
          syncMode: undefined,
          verbosity: undefined,
          proxy: undefined,
          silent: undefined
        };
        expectedConfig.account = {devPassword: path.join(expectedConfig.datadir, "devPassword")};

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
          rpcApi: ['eth', 'web3', 'net', 'debug', "personal"],
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          vmdebug: false,
          whisper: false,
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug", "personal"],
          wsHost: defaultHost,
          wsOrigins: false,
          wsPort: 12346,
          wsRPC: true,
          targetGasLimit: false,
          syncMode: undefined,
          verbosity: undefined,
          proxy: true,
          accounts: [
            {
              nodeAccounts: true,
              numAddresses: "2",
              password: "config/development/devpassword"
            },
            {
              mnemonic: "example exile argue silk regular smile grass bomb merge arm assist farm",
              numAddresses: "3"
            }
          ]
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
          rpcApi: ['eth', 'web3', 'net', 'debug', 'personal'],
          rpcCorsDomain: true,
          networkId: 1,
          port: 123456,
          nodiscover: true,
          maxpeers: 25,
          mine: true,
          vmdebug: false,
          whisper: false,
          bootnodes: "",
          wsApi: ["eth", "web3", "net", "shh", "debug", "personal"],
          wsHost: defaultHost,
          wsOrigins: false,
          wsPort: 12346,
          wsRPC: true,
          targetGasLimit: false,
          syncMode: undefined,
          verbosity: undefined,
          proxy: true,
          silent: undefined,
          account: {
            numAccounts: "2",
            devPassword: path.normalize("/foo/datadir/devPassword"),
            password: "config/development/devpassword",
            balance: undefined
          }
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
