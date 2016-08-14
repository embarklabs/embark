var async = require('async');
var Web3 = require('web3');

var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');

var Embark = {
  initConfig: function(configDir, files, env) {
    this.contractsManager = new ContractsManager(configDir, files, env);
    this.contractsManager.init();
    return this.contractsManager;
  }
};

//module.exports = Embark;

async.waterfall([
  function loadConfig(callback) {
    var contractsManager = Embark.initConfig('config/', 'app/contracts/**/*.sol', 'development');
    callback(null, contractsManager);
  },
  function buildContracts(contractsManager, callback) {
    contractsManager.build();
    callback(null, contractsManager);
  },
  function deployContracts(contractsManager, callback) {
    var web3 = new Web3();
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
    var deploy = new Deploy(web3, contractsManager);
    deploy.deployAll(function() {
      callback(null, contractsManager);
    });
  },
  function generateABI(contractsManager, callback) {
    var abiGenerator = new ABIGenerator(contractsManager);
    console.log(abiGenerator.generateProvider());
    console.log(abiGenerator.generateContracts());
    callback(null, 'done');
  },
], function(err, result) {
  console.log(arguments);
});

