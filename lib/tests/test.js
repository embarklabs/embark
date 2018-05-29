const async = require('async');
const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const utils = require('../utils/utils');
const constants = require('../constants');

function getSimulator() {
  try {
    return require('ganache-cli');
  } catch (e) {
    const moreInfo = 'For more information see https://github.com/trufflesuite/ganache-cli';
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error(__('Simulator not found; Please install it with "%s"', 'npm install ganache-cli --save'));
      console.error(moreInfo);
      throw e;
    }
    console.error("==============");
    console.error(__("Tried to load Ganache CLI (testrpc), but an error occurred. This is a problem with Ganache CLI"));
    console.error(moreInfo);
    console.error("==============");
    throw e;
  }
}

class Test {
  constructor(options) {
    this.options = options || {};
    this.simOptions = this.options.simulatorOptions || {};
    this.web3 = new Web3();
    if (this.simOptions.node) {
      this.web3.setProvider(new this.web3.providers.HttpProvider(this.simOptions.node));
    } else {
      this.sim = getSimulator();
      this.web3.setProvider(this.sim.provider(this.simOptions));
    }

    this.engine = new Engine({
      env: this.options.env || 'test',
      // TODO: config will need to detect if this is a obj
      embarkConfig: this.options.embarkConfig || 'embark.json',
      interceptLogs: false
    });

    this.engine.init({
      logger: new TestLogger({logLevel: 'debug'})
    });

    this.engine.startService("libraryManager");
    this.engine.startService("codeRunner");
    this.engine.startService("web3", {
      web3: this.web3
    });
    this.engine.startService("deployment", {
      trackContracts: false
    });
    this.engine.startService("codeGenerator");
  }

  config(options, callback) {
    this.options = utils.recursiveMerge(this.options, options);
    this.simOptions = this.options.simulatorOptions || {};

    this._deploy(options, (err, accounts) => {
      if (err) {
        console.error(err);
        return callback(err);
      }
      callback(null, accounts);
    });
  }

  _deploy(config, cb) {
    const self = this;
    async.waterfall([
      function getConfig(callback) {
        let _versions_default = self.engine.config.contractsConfig.versions;
        self.engine.config.contractsConfig = {contracts: config.contracts, versions: _versions_default};
        callback();
      },
      function reloadConfig(callback) {
        self.engine.events.emit(constants.events.contractConfigChanged, self.engine.config.contractsConfig);
        callback();
      },
      function deploy(callback) {
        self.engine.deployManager.gasLimit = 6000000;
        self.engine.contractsManager.gasLimit = 6000000;
        self.engine.deployManager.fatalErrors = true;
        self.engine.deployManager.deployOnlyOnConfig = true;
        self.engine.deployManager.deployContracts(true, function(err, _result) {
          if (err) {
            callback(err);
          }
          callback();
        });
      }
    ], function(err) {
      if (err) {
        console.log(__('terminating due to error'));
        cb(err);
      }
      // this should be part of the waterfall and not just something done at the
      // end
      self.web3.eth.getAccounts(function(err, accounts) {
        if (err) {
          throw new Error(err);
        }
        self.web3.eth.defaultAccount = accounts[0];
        cb(null, accounts);
      });
    });
  }
}

module.exports = Test;
