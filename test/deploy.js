var Config = require('../lib/config/config.js');
var Deploy = require('../lib/deploy.js');
var Compiler = require('../lib/compiler.js');
var assert = require('assert');

describe('embark.deploy', function() {
  var files = [
    'test/support/contracts/wallet.sol',
    'test/support/contracts/simple_storage.sol',
    'test/support/contracts/another_storage.sol',
    'test/support/contracts/wallets.sol'
  ];
  var _blockchainConfig = (new Config.Blockchain()).loadConfigFile('test/support/blockchain.yml');
  var blockchainConfig = _blockchainConfig.config("development");
  var compiler = new Compiler(_blockchainConfig);
  var contractsConfig = new Config.Contracts(blockchainConfig, compiler);
  contractsConfig.loadConfigFile('test/support/arguments.yml');
  contractsConfig.init(files);
  var deploy = new Deploy('development', files, blockchainConfig, contractsConfig);

  describe('#deploy_contracts', function() {
    compiler.init('development');
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
      "SimpleStorage":  {compiled: {info: {abiDefinition: 123}}},
      "AnotherStorage": {compiled: {info: {abiDefinition: 234}}}
    }

    it("should deploy contracts", function() {
      compiler.init('development');
      var result = deploy.generate_abi_file();

      assert.strictEqual(result, "web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));web3.eth.defaultAccount = web3.eth.accounts[0];var SimpleStorageAbi = 123;var SimpleStorageContract = web3.eth.contract(SimpleStorageAbi);var SimpleStorage = SimpleStorageContract.at('0x123');var AnotherStorageAbi = 234;var AnotherStorageContract = web3.eth.contract(AnotherStorageAbi);var AnotherStorage = AnotherStorageContract.at('0x234');");
    });
  });

});
