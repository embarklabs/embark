var Config = require('../lib/config/config.js');
var Deploy = require('../lib/deploy.js');
var assert = require('assert');
var web3 = require('web3');

describe('embark.deploy', function() {
  var files = [
    'test/support/contracts/wallet.sol',
    'test/support/contracts/simple_storage.sol',
    'test/support/contracts/another_storage.sol',
    'test/support/contracts/wallets.sol'
  ];
  var blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml').config("development");
  var contractsConfig = new Config.Contracts(files, blockchainConfig, web3);
  contractsConfig.loadConfigFile('test/support/arguments.yml');
  var deploy = new Deploy('development', files, blockchainConfig, contractsConfig);

  describe('#deploy_contracts', function() {
    deploy.deploy_contracts("development");

    it("should deploy contracts", function() {
      var all_contracts = ['Wallet', 'SimpleStorage', 'AnotherStorage', 'Wallets'];
      for(var i=0; i < all_contracts; i++) {
        var className = all_contracts[i];

        assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
      }
    });

  });

  describe('#generate_abi_file', function() {
    deploy.deployedContracts = {
      "SimpleStorage": "0x123",
      "AnotherStorage": "0x234"
    }
    deploy.contractDB = {
      "SimpleStorage": {info: {abiDefinition: 123}},
      "AnotherStorage": {info: {abiDefinition: 234}}
    }

    it("should deploy contracts", function() {
      var result = deploy.generate_abi_file();

      assert.strictEqual(result, "web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));web3.eth.defaultAccount = web3.eth.accounts[0];var SimpleStorageAbi = 123;var SimpleStorageContract = web3.eth.contract(SimpleStorageAbi);var SimpleStorage = SimpleStorageContract.at('0x123');var AnotherStorageAbi = 234;var AnotherStorageContract = web3.eth.contract(AnotherStorageAbi);var AnotherStorage = AnotherStorageContract.at('0x234');");
    });
  });

});
