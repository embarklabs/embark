var Config = require('../lib/config/config.js');
var assert = require('assert');
var sinon = require('sinon');
var web3 = require('web3');
require('mocha-sinon');

describe('embark.config.contracts', function() {
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config("development");
  //sinon.stub(web3, "setProvider");
  //sinon.stub(web3.eth.compile, "solidity", function() {
  //  return "compiled_code";
  //});

  describe('#loadConfigFile', function() {
    it('should read and load yml file', function() {
      var contractsConfig = new Config.Contracts([], blockchainConfig, web3);
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
      var contractsConfig = new Config.Contracts([], blockchainConfig, web3);
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
        contractsConfig = new Config.Contracts(files, blockchainConfig, web3);
        contractsConfig.loadConfigFile('test/support/contracts.yml');
        contractsConfig.compileContracts();
      });

      it('add contracts to a list', function() {
        assert.deepEqual(contractsConfig.all_contracts, [ "SimpleStorage", "AnotherStorage" ]);
      });
    });
  });
});

