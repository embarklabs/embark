var async = require('async');
var Web3 = require('web3');

var Embark = require('../index.js');

var Engine = require('./engine.js');

var ABIGenerator = require('../contracts/abi.js');
var ContractsManager = require('../contracts/contracts.js');
var Deploy = require('../contracts/deploy.js');

var Config = require('./config.js');
var RunCode = require('./runCode.js');
var TestLogger = require('./test_logger.js');

var getSimulator = function() {
  try {
    var sim = require('ethereumjs-testrpc');
    return sim;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('Simulator not found; Please install it with "npm install ethereumjs-testrpc --save"');
      console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save"');
      console.log('For more information see https://github.com/ethereumjs/testrpc');
      // TODO: should throw exception instead
      return process.exit();
    }
    console.log("==============");
    console.log("Tried to load testrpc but an error occurred. This is a problem with testrpc");
    console.log('IMPORTANT: if you using a NodeJS version older than 6.9.1 then you need to install an older version of testrpc "npm install ethereumjs-testrpc@2.0 --save". Alternatively install node 6.9.1 and the testrpc 3.0');
    console.log("==============");
    throw e;
  }
};

var Test = function(options) {
  this.options = options || {};
  var simOptions = this.options.simulatorOptions || {};

  this.engine = new Engine({
    env: this.options.env || 'test',
    // TODO: confi will need to detect if this is a obj
    embarkConfig: this.options.embarkConfig || 'embark.json',
    interceptLogs: false
  });

  this.engine.init({
    logger: new TestLogger({logLevel: this.options.logLevel || 'debug'})
  });

  this.sim = getSimulator();
  this.web3 = new Web3();
  this.web3.setProvider(this.sim.provider(simOptions));
};

Test.prototype.deployAll = function(contractsConfig, cb) {
  var self = this;

  async.waterfall([
      function getConfig(callback) {
        self.engine.config.contractsConfig = {contracts: contractsConfig};
        callback();
      },
      function startServices(callback) {
        //{abiType: 'contracts', embarkJS: false}
        self.engine.startService("abi");
        self.engine.startService("deployment", {
          web3: self.web3,
          trackContracts: false
        });
        callback();
      },
      function deploy(callback) {
        self.engine.events.on('abi-contracts-vanila', function(vanillaABI) {
          callback(null, vanillaABI);
        });
        self.engine.deployManager.deployContracts(function(err, result) {
          if (err) {
            console.log(err);
            callback(err);
          }
        });
      }
  ], function(err, result) {
    if (err) {
      console.log("got error");
      process.exit();
    }
    // this should be part of the waterfall and not just something done at the
    // end
    self.web3.eth.getAccounts(function(err, accounts) { 
      if (err) {
        throw new Error(err);
      }
      self.web3.eth.defaultAccount = accounts[0];
      RunCode.doEval(result, self.web3); // jshint ignore:line
      cb();
    });
  });
};

module.exports = Test;
