var Config = require('../lib/config/config.js');
var Deploy = require('../lib/deploy.js');
var Compiler = require('../lib/compiler.js');
var ChainManager = require('../lib/chain_manager.js');
var assert = require('assert');
var web3 = require('web3');

// TODO: replace with ethersim
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8101"));

setDeployConfig = function(config) {
  var _blockchainConfig = (new Config.Blockchain()).loadConfigFile(config.blockchain);
  var blockchainConfig = _blockchainConfig.config("development");
  var compiler = new Compiler(_blockchainConfig);
  var contractsConfig = new Config.Contracts(blockchainConfig, compiler);
  var chainManager = (new ChainManager()).loadConfigFile('./test/support/chain_manager.json');
  contractsConfig.loadConfigFile(config.contracts);
  contractsConfig.init(config.files, 'development');
  compiler.init('development');
  return new Deploy('development', config.files, blockchainConfig, contractsConfig, chainManager, true, false, web3);
}

function Done(fn) {
  var self   = this;
  var called = false;

  /**
   *
   * @param {*} params...
   */
  this.trigger = function (params) {
    if(called) {
      return;
    }

    fn.apply(self, arguments);
    called = true;
  };
}

describe('embark.deploy', function() {

  describe('contracts as arguments to other contracts', function() {
    var files = [
      'test/support/contracts/wallet.sol',
      'test/support/contracts/simple_storage.sol',
      'test/support/contracts/another_storage.sol',
      'test/support/contracts/wallets.sol'
    ];

    describe('#deploy_contracts', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/arguments.yml'
      });

      it("should deploy contracts", function(fn) {
        var doneWrap = new Done(fn);

        deploy.deploy_contracts("development", function() {
          var all_contracts = ['Wallet', 'SimpleStorage', 'AnotherStorage', 'Wallets'];
          for(var i=0; i < all_contracts.length; i++) {
            var className = all_contracts[i];

            assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
          }

          doneWrap.trigger();
        });

      });

    });

    describe('#generate_abi_file', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/arguments.yml'
      });
      deploy.deployedContracts = {
        "SimpleStorage": "0x123",
        "AnotherStorage": "0x234"
      }
      deploy.contractDB = {
        "SimpleStorage":  {compiled: {info: {abiDefinition: 123}}},
        "AnotherStorage": {compiled: {info: {abiDefinition: 234}}}
      }

      it("should deploy contracts", function() {
        var result = "";

        result += deploy.generate_provider_file();
        result += deploy.generate_abi_file();

        assert.strictEqual(result, "var web3 = new Web3();web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));web3.eth.defaultAccount = web3.eth.accounts[0];blockchain = {\"testnet\":false,\"rpcHost\":\"localhost\",\"rpcPort\":8101,\"gasLimit\":1000000,\"gasPrice\":10000000000000,\"rpcWhitelist\":\"*\",\"nat\":[],\"minerthreads\":1,\"genesisBlock\":\"config/genesis.json\",\"datadir\":\"/tmp/embark\",\"bootNodes\":[],\"deployTimeout\":20,\"networkId\":"+deploy.blockchainConfig.networkId+",\"maxPeers\":4,\"mine\":false,\"port\":\"30303\",\"console_toggle\":false,\"mine_when_needed\":true,\"whisper\":false,\"account\":{\"init\":true,\"password\":\"config/password\"},\"geth_extra_opts\":[],\"deploy_synchronously\":false};SimpleStorageAbi = 123;SimpleStorageContract = web3.eth.contract(SimpleStorageAbi);SimpleStorage = SimpleStorageContract.at('0x123');AnotherStorageAbi = 234;AnotherStorageContract = web3.eth.contract(AnotherStorageAbi);AnotherStorage = AnotherStorageContract.at('0x234');contractDB = {\"SimpleStorage\":{\"compiled\":{\"info\":{\"abiDefinition\":123}}},\"AnotherStorage\":{\"compiled\":{\"info\":{\"abiDefinition\":234}}}};");
      });
    });
  });

  describe('contracts as arguments to other contracts with stubs', function() {
    var files = [
      'test/support/contracts/crowdsale.sol',
      'test/support/contracts/token.sol'
    ];

    describe('#deploy_contracts', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/arguments2.yml'
      });

      it("should deploy contracts", function(fn) {
        var doneWrap = new Done(fn);

        deploy.deploy_contracts("development", function() {

          var all_contracts = ['token', 'Crowdsale'];
          for(var i=0; i < all_contracts.length; i++) {
            var className = all_contracts[i];

            assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
          }

          doneWrap.trigger();
        });

      });

    });

  });

  describe('contracts instances', function() {
    var files = [
      'test/support/contracts/simple_storage.sol'
    ];

    describe('#deploy_contracts', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/instances.yml'
      });

      it("should deploy contracts", function(fn) {
        var doneWrap = new Done(fn);

        deploy.deploy_contracts("development", function() {

          var all_contracts = ['BarStorage', 'FooStorage'];
          for(var i=0; i < all_contracts.length; i++) {
            var className = all_contracts[i];

            assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
          }
          assert.notEqual(deploy.deployedContracts.hasOwnProperty('SimpleStorage'), true);

          doneWrap.trigger();
        });
      });

    });

  });

  describe('contracts deploy script', function() {
    var files = [
      'test/support/contracts/data_source.sol',
      'test/support/contracts/manager.sol'
    ];

    describe('#deploy_contracts', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/arguments3.yml'
      });

      it("should deploy contracts", function(fn) {
        var doneWrap = new Done(fn);

        deploy.deploy_contracts("development", function() {
          var all_contracts = ['DataSource', 'MyDataSource', 'Manager'];
          for(var i=0; i < all_contracts.length; i++) {
            var className = all_contracts[i];

            assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
          }

          doneWrap.trigger();
        });
      });

      it("should execute deploy changes", function(fn) {
        var doneWrap = new Done(fn);

        web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
        web3.eth.defaultAccount = web3.eth.accounts[0];

        data_source_abi     = deploy.contractDB['DataSource'].compiled.info.abiDefinition;
        data_source_address = deploy.deployedContracts['DataSource'];
        my_data_source_abi     = deploy.contractDB['MyDataSource'].compiled.info.abiDefinition;
        my_data_source_address = deploy.deployedContracts['MyDataSource'];
        manager_abi     = deploy.contractDB['Manager'].compiled.info.abiDefinition;
        manager_address = deploy.deployedContracts['Manager'];

        DataSource = web3.eth.contract(data_source_abi).at(data_source_address);
        MyDataSource = web3.eth.contract(my_data_source_abi).at(my_data_source_address);
        ManagerSource = web3.eth.contract(manager_abi).at(manager_address);

        assert.equal(DataSource.storeData().toNumber(), 5);
        assert.equal(Manager.data().toString(), my_data_source_address);

        doneWrap.trigger();
      });

    });

  });

  describe('contracts with addresses defined', function() {
    var files = [
      'test/support/contracts/simple_storage.sol'
    ];

    describe('#deploy_contracts', function() {
      var deploy = setDeployConfig({
        files: files,
        blockchain: 'test/support/blockchain.yml',
        contracts: 'test/support/address.yml'
      });

      it("should not deploy contracts with addresses defined", function(fn) {
        var doneWrap = new Done(fn);

        deploy.deploy_contracts("development", function() {
          var expected_deploys = ['SimpleStorage', 'BarStorage', 'FooStorage'];

          for(var i=0; i < expected_deploys.length; i++) {
            var className = expected_deploys[i];

            assert.equal(deploy.deployedContracts.hasOwnProperty(className), true);
          }

          assert.equal(deploy.deployedContracts['SimpleStorage'], '0x123');
          assert.equal(deploy.deployedContracts['BarStorage'], '0x234');

          doneWrap.trigger();
        });
      });

    });

  });

});
