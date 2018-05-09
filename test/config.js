/*globals describe, it*/
const Config = require('../lib/core/config.js');
const Plugins = require('../lib/core/plugins.js');
const assert = require('assert');
const TestLogger = require('../lib/tests/test_logger.js');
const Events = require('../lib/core/events');

describe('embark.Config', function () {
  let config = new Config({
    env: 'myenv',
    configDir: './test/test1/config/',
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
        "isDev": true,
        "mineWhenNeeded": true,
        "nodiscover": true,
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
  });

  describe('#loadContractsConfigFile', function () {
    it('should load contract config correctly', function () {
      config.loadContractsConfigFile();
      let expectedConfig = {
        versions: {'web3': '1.0.0-beta', solc: '0.4.17'},
        deployment: {host: 'localhost', port: 8545, type: 'rpc'},
        dappConnection: ['$WEB3', 'localhost:8545'],
        "gas": "auto",
        "contracts": {
          "SimpleStorage": {
            "args": [100],
            "gas": 123456
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
        }
      ];
      const expected = [
        {
          "filename": ".embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol",
          "type": "http",
          "path": "https://raw.githubusercontent.com/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol",
          "basedir": "",
          "resolver": undefined
        },
        {
          "filename": ".embark/contracts/status-im/contracts/master/contracts/identity/ERC725.sol",
          "type": "http",
          "path": "https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol",
          "basedir": "",
          "resolver": undefined
        }
      ];
      config.loadExternalContractsFiles();
      assert.deepEqual(config.contractsFiles, expected);
    });
  });
});
