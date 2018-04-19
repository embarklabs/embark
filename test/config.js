/*globals describe, it*/
const Config = require('../lib/core/config.js');
const Plugins = require('../lib/core/plugins.js');
const assert = require('assert');
const TestLogger = require('../lib/tests/test_logger.js');

describe('embark.Config', function () {
  let config = new Config({
    env: 'myenv',
    configDir: './test/test1/config/'
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
        "mineWhenNeeded": true,
        "nodiscover": true,
        "rpcHost": "localhost",
        "rpcPort": 8545,
        "rpcCorsDomain": "http://localhost:8000",
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
        versions: {'web3.js': '1.0.0-beta', solc: '0.4.17'},
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

  describe('#getExternalContractUrl', function () {
    it('should get the right url for a https://github file', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'https://github.com/embark-framework/embark/blob/master/test_app/app/contracts/simple_storage.sol'}
      );
      assert.deepEqual(fileObj,
        {
          filePath: 'embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
          url: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol'
        });
    });

    it('should fail for a malformed https://github file', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'https://github/embark-framework/embark/blob/master/test_app/app/contracts/simple_storage.sol'}
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url for a git:// file with no branch #', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'git://github.com/status-im/contracts/contracts/identity/ERC725.sol'}
      );
      assert.deepEqual(fileObj,
        {
          filePath: 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url for a git:// file with a branch #', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'git://github.com/status-im/contracts/contracts/identity/ERC725.sol#myBranch'}
      );
      assert.deepEqual(fileObj,
        {
          filePath: 'status-im/contracts/myBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/myBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail when the git:// file is malformed', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'git://github.com/identity/ERC725.sol#myBranch'}
      );
      assert.strictEqual(fileObj, null);
    });

    it('should get the right url with a github.com file without branch #', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'github.com/status-im/contracts/contracts/identity/ERC725.sol'}
      );
      assert.deepEqual(fileObj,
        {
          filePath: 'status-im/contracts/master/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/master/contracts/identity/ERC725.sol'
        });
    });

    it('should get the right url with a github.com file with branch #', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'github.com/status-im/contracts/contracts/identity/ERC725.sol#theBranch'}
      );
      assert.deepEqual(fileObj,
        {
          filePath: 'status-im/contracts/theBranch/contracts/identity/ERC725.sol',
          url: 'https://raw.githubusercontent.com/status-im/contracts/theBranch/contracts/identity/ERC725.sol'
        });
    });

    it('should fail with a malformed github.com url', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'github/status-im/contracts/contracts/identity/ERC725.sol#theBranch'}
      );
      assert.strictEqual(fileObj, null);
    });

    it('should succeed with a generic http url', function () {
      const fileObj = config.getExternalContractUrl(
        {file: 'http://myurl.com/myFile.sol'}
      );
      assert.deepEqual(fileObj, {
        filePath: 'myFile.sol',
        url: 'http://myurl.com/myFile.sol'
      });
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
          "filename": ".embark/contracts/simple_storage.sol",
          "type": "http",
          "path": "https://raw.githubusercontent.com/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol",
          "basedir": "",
          "resolver": undefined
        },
        {
          "filename": ".embark/contracts/ERC725.sol",
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
