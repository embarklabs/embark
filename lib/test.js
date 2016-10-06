var async = require('async');
var Web3 = require('web3');
var Embark = require('./index.js');
var ContractsManager = require('./contracts.js');
var Deploy = require('./deploy.js');
var TestLogger = require('./test_logger.js');
var Config = require('./config.js');
var ABIGenerator = require('./abi.js');

var Test = function(options) {
  try {
    this.sim = require('ethereumjs-testrpc');
  } catch(e) {
    this.sim = false;
  }

  if (this.sim === false) {
    console.log('Simulator not found; Please install it with "npm install -g ethereumjs-testrpc');
    console.log('For more information see https://github.com/ethereumjs/testrpc');
    exit();
  }
};

Test.prototype.deployAll = function(contractsConfig, cb) {
  var self = this;
  this.web3 = new Web3();
  this.web3.setProvider(this.sim.provider());
  var logger = new TestLogger({logLevel: 'debug'});

  async.waterfall([
      function buildContracts(callback) {
        var config = new Config('test');
        config.contractsFiles = config.loadFiles(["app/contracts/**"]);
        config.contractsConfig = {contracts: contractsConfig} ;

        var contractsManager = new ContractsManager({
          contractFiles:  config.contractsFiles,
          contractsConfig: config.contractsConfig,
          logger: logger
        });
        contractsManager.build();
        callback(null, contractsManager);
      },
      function deployContracts(contractsManager, callback) {
        var deploy = new Deploy({
          web3: self.web3,
          contractsManager: contractsManager,
          logger: logger,
          chainConfig: false,
          env: 'test'
        });
        deploy.deployAll(function() {
          callback(null, contractsManager);
        });
      },
      function generateABI(contractsManager, callback) {
        var abiGenerator = new ABIGenerator({}, contractsManager);
        var ABI = abiGenerator.generateContracts(false);
        callback(null, ABI);
      }
  ], function(err, result) {
    self.web3.eth.getAccounts(function(err, accounts) { 
      var web3 = self.web3;
      web3.eth.defaultAccount = accounts[0];
      eval(result);
      cb();
    });
  });
};

module.exports = Test;
