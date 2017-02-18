var async = require('async');
var Web3 = require('web3');
var Embark = require('./index.js');
var ContractsManager = require('./contracts.js');
var Deploy = require('./deploy.js');
var TestLogger = require('./test_logger.js');
var Config = require('./config.js');
var ABIGenerator = require('./abi.js');

var Test = function(_options) {
  var options = _options || {};
  var simOptions = options.simulatorOptions || {};

  try {
    this.sim = require('ethereumjs-testrpc');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('Simulator not found; Please install it with "npm install ethereumjs-testrpc --save"');
      console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save"');
      console.log('For more information see https://github.com/ethereumjs/testrpc');
      // TODO: should throw exception instead
      process.exit();
    } else {
      console.log("==============");
      console.log("Tried to load testrpc but an error occurred. This is a problem with testrpc");
      console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save". Alternatively install node 6.9.1 and the testrpc 3.0');
      console.log("==============");
      throw e;
    }
  }

  this.web3 = new Web3();
  this.web3.setProvider(this.sim.provider(simOptions));
};

Test.prototype.deployAll = function(contractsConfig, cb) {
  var self = this;
  var logger = new TestLogger({logLevel: 'debug'});

  async.waterfall([
      function getConfig(callback) {
        var config = new Config({env: 'test', logger: logger});
        config.loadConfigFiles({embarkConfig: 'embark.json', interceptLogs: false});
        config.contractsConfig = {contracts: contractsConfig};
        callback(null, config);
      },
      function buildContracts(config, callback) {
        var contractsManager = new ContractsManager({
          contractFiles:  config.contractsFiles,
          contractsConfig: config.contractsConfig,
          logger: logger,
          plugins: config.plugins
        });
        contractsManager.build(function() {
          callback(null, contractsManager);
        });
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
        var abiGenerator = new ABIGenerator({contractsManager: contractsManager});
        var ABI = abiGenerator.generateContracts(false);
        callback(null, ABI);
      }
  ], function(err, result) {
    if (err) {
      throw new Error(err);
    }
    self.web3.eth.getAccounts(function(err, accounts) { 
      if (err) {
        throw new Error(err);
      }
      var web3 = self.web3;
      web3.eth.defaultAccount = accounts[0];
      // TODO: replace evals with separate process so it's isolated and with
      // a callback
      eval(result); // jshint ignore:line
      cb();
    });
  });
};

module.exports = Test;
