let getSimulator = function() {
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

let Test;
Test = (function (options) {
  let async = require('async');
  let opts = options === undefined ? {} : options;
  opts.logLevel = opts.hasOwnProperty('logLevel') ? opts.logLevel : 'debug';
  opts.simulatorOptions = opts.hasOwnProperty('simulatorOptions') ? opts.simulatorOptions : {};
  let sim = getSimulator();

  function newWebThree() {
    try {
      let Web3 = require('web3');
      let web3 = new Web3();
      web3.setProvider(sim.provider(opts.simulatorOptions));
      return web3;
    } catch (e) {
      throw new Error(e);
    }
  }

  function deployAll(contractsConfig, cb) {
    let RunCode = require('./runCode.js');
    let self = this;

    function newEngine () {
      let Engine = require('./engine.js');
      return new Engine({
        env: opts.env || 'test',
        // TODO: confi will need to detect if this is a obj
        embarkConfig: opts.embarkConfig || 'embark.json',
        interceptLogs: false
      });
    }

    self.web3 = newWebThree();
    self.engine = newEngine();
    self.engine.init();

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
        self.engine.events.on('abi-contracts-vanila', function (vanillaABI) {
          callback(null, vanillaABI);
        });
        self.engine.deployManager.deployContracts(function (err, result) {
          if (err) {
            console.log(err);
            callback(err);
          }
        });
      }
    ], function (err, result) {
      if (err) {
        console.log("got error");
        process.exit();
      }
      // this should be part of the waterfall and not just something done at the
      // end
      self.web3.eth.getAccounts(function (err, accounts) {
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
    deployAll: deployAll,
    sim: sim
  };
}());

module.exports = Test;
