/*globals describe, it*/
const Config = require('../lib/core/config.js');
const Plugins = require('../lib/core/plugins.js');
const assert = require('assert');
const TestLogger = require('../lib/utils/test_logger');
const Events = require('../lib/core/events');

describe('embark.Config', function () {
  let config = new Config({
    env: 'myenv',
    configDir: './dist/test/test1/config/',
    events: new Events()
  });
  config.plugins = new Plugins({plugins: {}});
  config.logger = new TestLogger({});

  describe('#loadBlockchainConfigFile', function () {
    it('should load blockchain config correctly', function () {
      config.loadBlockchainConfigFile();
      let expectedConfig = {
        "enabled": true,
        "networkType": "custom",
        "genesisBlock": "config/development/genesis.json",
        "datadir": ".embark/development/datadir",
        "isDev": false,
        "mineWhenNeeded": true,
        "nodiscover": true,
        "proxy": true,
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": "http://localhost:8000",
        "wsOrigins": "auto",
        "account": {
          "password": "config/development/password"
        }
      };

      assert.deepEqual(config.blockchainConfig, expectedConfig);
    });

    it('should convert Ether units', function () {
      let expectedConfig = {
        "enabled": true,
        "networkType": "custom",
        "genesisBlock": "config/development/genesis.json",
        "datadir": ".embark/development/datadir",
        "isDev": false,
        "targetGasLimit": "300000",
        "gasPrice": "8000000",
        "mineWhenNeeded": true,
        "nodiscover": true,
        "proxy": true,
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": "http://localhost:8000",
        "wsOrigins": "auto",
        "account": {
          "password": "config/development/password",
          "balance": "3000000000000000000"
        }
      };

      let config = new Config({
        env: 'unitenv',
        configDir: './dist/test/test1/config/',
        events: new Events()
      });
      config.plugins = new Plugins({plugins: {}});
      config.logger = new TestLogger({});
      config.loadBlockchainConfigFile();

      assert.deepEqual(config.blockchainConfig, expectedConfig);
    });

    it('should accept unitless gas values', function () {
      let expectedConfig = {
        "enabled": true,
        "networkType": "custom",
        "genesisBlock": "config/development/genesis.json",
        "datadir": ".embark/development/datadir",
        "isDev": false,
        "targetGasLimit": "20000000",
        "gasPrice": "8000000",
        "mineWhenNeeded": true,
        "nodiscover": true,
        "proxy": true,
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": "http://localhost:8000",
        "wsOrigins": "auto",
        "account": {
          "password": "config/development/password",
          "balance": "3000000000000000000"
        }
      };

      let config = new Config({
        env: 'unitlessenv',
        configDir: './dist/test/test1/config/',
        events: new Events()
      });
      config.plugins = new Plugins({plugins: {}});
      config.logger = new TestLogger({});
      config.loadBlockchainConfigFile();

      assert.deepEqual(config.blockchainConfig, expectedConfig);
    });
  });

  describe('#loadContractsConfigFile', function () {
    it('should load contract config correctly', function () {
      config.loadContractsConfigFile();
      let expectedConfig = {
        versions: {'web3': '1.0.0-beta', solc: '0.4.25'},
        deployment: {host: 'localhost', port: 8545, type: 'rpc', "accounts": [{"mnemonic": "12 word mnemonic", "balance": "5000000000"}]},
        dappConnection: ['$WEB3', 'localhost:8545'],
        "gas": "400000",
        "strategy": "implicit",
        "contracts": {
          "SimpleStorage": {
            "args": [100],
            "gas": "123000",
            "gasPrice": "1000"
          },
          "Token": {
            "args": [200]
          }
        }
      };

      assert.deepEqual(config.contractsConfig, expectedConfig);
    });
  });

  describe('#loadExternalContractsFiles', function () {
    it('should create the right list of files and download', function () {
      config.contractsFiles = [];
      config.contractsConfig.contracts = [
        {
          file: 'https://github.com/embark-framework/embark/blob/master/test_app/app/contracts/simple_storage.sol'
        },
        {
          file: 'github.com/status-im/contracts/contracts/identity/ERC725.sol'
        },
        {
          file: 'bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63'
        }
      ];
      const expected = [
        {
          "filename": ".embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol",
          "type": "http",
          "path": "https://raw.githubusercontent.com/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol",
          "pluginPath": '',
          "importRemappings": [],
          "basedir": "",
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": undefined,
          "downloadedImports": false
        },
        {
          "filename": ".embark/contracts/status-im/contracts/master/contracts/identity/ERC725.sol",
          "type": "http",
          "path": "https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol",
          "pluginPath": '',
          "importRemappings": [],
          "basedir": "",
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": undefined,
          "downloadedImports": false
        },
        {
          "filename": ".embark/contracts/bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63",
          "type": "http",
          "path": "https://swarm-gateways.net/bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63",
          "pluginPath": '',
          "importRemappings": [],
          "basedir": "",
          "resolver": undefined,
          "storageConfig": undefined,
          "providerUrl": undefined,
          "downloadedImports": false
        }
      ];
      config.loadExternalContractsFiles();
      assert.deepEqual(config.contractsFiles, expected);
    });
  });
});
