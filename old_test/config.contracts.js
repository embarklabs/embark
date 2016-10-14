var Config = require('../lib/config/config.js');
var Compiler = require('../lib/compiler.js');
var assert = require('assert');
var sinon = require('sinon');
require('mocha-sinon');

describe('embark.config.contracts', function() {
  var _blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml');
  var blockchainConfig = _blockchainConfig.config("development");
  var compiler = new Compiler(_blockchainConfig);

  describe('#loadConfigFile', function() {
    it('should read and load yml file', function() {
      var contractsConfig = new Config.Contracts(blockchainConfig, compiler);
      contractsConfig.loadConfigFile('test/support/contracts.yml');

      assert.equal(contractsConfig.contractConfig.hasOwnProperty('development'), true)
      assert.equal(contractsConfig.contractConfig.hasOwnProperty('staging'), true)
    });

    it('should throw exception reading invalid file', function() {
      assert.throws(function() { contractsConfig.loadConfigFile('test/support/invalid.yml') }, Error);
    });
  });

  describe('#loadConfig', function() {
    it('should load config', function() {
      var contractsConfig = new Config.Contracts([], blockchainConfig, compiler);
      var hsh = {
        development: {},
        staging: {}
      };

      contractsConfig.loadConfig(hsh);

      assert.equal(contractsConfig.contractConfig.hasOwnProperty('development'), true)
      assert.equal(contractsConfig.contractConfig.hasOwnProperty('staging'), true)
    });
  });

  describe('#compileContracts', function() {
    context("simple contracts", function() {
      before(function() {
        files = [
          'test/support/contracts/simple_storage.sol',
          'test/support/contracts/another_storage.sol'
        ]
        contractsConfig = new Config.Contracts(blockchainConfig, compiler);
        contractsConfig.loadConfigFile('test/support/contracts.yml');
        contractsConfig.init(files, 'development');
        contractsConfig.compileContracts();
      });

      it('add contracts to a list', function() {
        //assert.deepEqual(contractsConfig.all_contracts, [ "SimpleStorage", "AnotherStorage" ]);
        assert.deepEqual(contractsConfig.all_contracts, [ "AnotherStorage", "SimpleStorage" ]);
      });
    });

    context("contracts as arguments to other contracts", function() {
      before(function() {
        files = [
          'test/support/contracts/wallet.sol',
          'test/support/contracts/simple_storage.sol',
          'test/support/contracts/another_storage.sol',
          'test/support/contracts/wallets.sol'
        ]
        contractsConfig = new Config.Contracts(blockchainConfig, compiler);
        contractsConfig.loadConfigFile('test/support/arguments.yml');
        contractsConfig.init(files, 'development');
        contractsConfig.compileContracts('development');
      });

      it('add contracts to a list', function() {
        assert.deepEqual(contractsConfig.all_contracts, [ "SimpleStorage", "AnotherStorage", "Wallet", "Wallets" ]);
      });
    });

    context("contracts instances", function() {
      before(function() {
        files = [
          'test/support/contracts/simple_storage.sol'
        ]
        contractsConfig = new Config.Contracts(blockchainConfig, compiler);
        contractsConfig.loadConfigFile('test/support/instances.yml');
        contractsConfig.init(files, 'development');
        contractsConfig.compileContracts('development');
      });

      it('add contracts to a list', function() {
        assert.deepEqual(contractsConfig.all_contracts, [ "SimpleStorage", "BarStorage", "FooStorage" ]);
      });
    });

    context("contracts as arguments to other contracts with stubs", function() {
      before(function() {
        files = [
          'test/support/contracts/crowdsale.sol',
          'test/support/contracts/token.sol'
        ]
        contractsConfig = new Config.Contracts(blockchainConfig, compiler);
        contractsConfig.loadConfigFile('test/support/arguments2.yml');
        contractsConfig.init(files, 'development');
        contractsConfig.compileContracts('development');
      });

      it('add contracts to a list', function() {
        assert.deepEqual(contractsConfig.all_contracts, [ "token", "Crowdsale" ]);
      });
    });

  });

});

