var async = require('async');
var Web3 = require('web3');

var getSimulator = function() {
  try {
    return require('ethereumjs-testrpc');
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
  var opts = options === undefined ? {} : options;
  opts.logLevel = opts.hasOwnProperty('logLevel') ? opts.logLevel : 'debug';
  opts.simulatorOptions = opts.hasOwnProperty('simulatorOptions') ? opts.simulatorOptions : {};

  function newWebThree () {
    try {
      var Web3 = require('web3');
      var web3 = new Web3();
      web3.setProvider(getSimulator());
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
      throw new Error(e);
    }
  }

  function deployAll (contractsConfig, cb) {
    var RunCode = require('./runCode.js');
    var self = this;

    function newEngine () {
      var Engine = require('./engine.js');
      return new Engine({
        env: opts.env || 'test',
        // TODO: confi will need to detect if this is a obj
        embarkConfig: opts.embarkConfig || 'embark.json',
        interceptLogs: false
      }).init();
    }

    function newLogger() {
      var TestLogger = require('./test_logger.js');
      new TestLogger({logLevel: opts.logLevel})
    }

    this.engine = newEngine();
    this.web3 = newWebThree();

    async.waterfall([
      function getConfig(callback) {
        contractsConfig = { contracts: contractsConfig };
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
  }


  return {
    deployAll: deployAll
  }
}();

module.exports = Test;
