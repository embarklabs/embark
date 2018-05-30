const async = require('async');
const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const utils = require('../utils/utils');
const constants = require('../constants');
const Events = require('../core/events');

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
    this.contracts = {};
    this.events = new Events();
    this.ready = true;

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

  init(callback) {
    this.engine.contractsManager.build(() => {
      callback();
    });
  }

  onReady(callback) {
    if (this.ready) {
      return callback();
    }
    this.events.once('ready', () => {
      callback();
    });
  }

  config(options, callback) {
    if (!callback) {
      callback = function () {};
    }
    this.options = utils.recursiveMerge(this.options, options);
    this.simOptions = this.options.simulatorOptions || {};
    this.ready = false;

    this._deploy(options, (err, accounts) => {
      this.ready = true;
      this.events.emit('ready');
      if (err) {
        console.error(err);
        return callback(err);
      }
      callback(null, accounts);
    });
  }

  _deploy(config, callback) {
    const self = this;
    async.waterfall([
      function getConfig(next) {
        let _versions_default = self.engine.config.contractsConfig.versions;
        self.engine.config.contractsConfig = {contracts: config.contracts, versions: _versions_default};
        self.engine.events.emit(constants.events.contractConfigChanged, self.engine.config.contractsConfig);
        next();
      },
      function deploy(next) {
        self.engine.deployManager.gasLimit = 6000000;
        self.engine.contractsManager.gasLimit = 6000000;
        self.engine.deployManager.fatalErrors = true;
        self.engine.deployManager.deployOnlyOnConfig = true;
        self.engine.deployManager.deployContracts(function (err) {
          if (err) {
            return next(err);
          }
          next();
        });
      },
      function getAccounts(next) {
        self.web3.eth.getAccounts(function (err, accounts) {
          if (err) {
            return next(err);
          }
          self.accounts = accounts;
          self.web3.eth.defaultAccount = accounts[0];
          next();
        });
      },
      function createContractObject(next) {
        async.each(Object.keys(self.contracts), (contractName, eachCb) => {
          const contract = self.engine.contractsManager.contracts[contractName];
          Object.assign(self.contracts[contractName], new self.web3.eth.Contract(contract.abiDefinition, contract.address,
            {from: self.web3.eth.defaultAccount, gas: 6000000}));
          eachCb();
        }, next);
      }
    ], function (err) {
      if (err) {
        console.log(__('terminating due to error'));
        throw new Error(err);
      }
      callback();
    });
  }

  require(module) {
    if (module.startsWith('contracts/')) {
      const contractName = module.substr(10);
      if (!this.engine.contractsManager.contracts[contractName]) {
        throw new Error(__('No contract with the name %s', contractName));
      }
      if (this.contracts[contractName]) {
        return this.contracts[contractName];
      }
      const contract = this.engine.contractsManager.contracts[contractName];
      this.contracts[contractName] = new this.web3.eth.Contract(contract.abiDefinition, contract.address,
        {from: this.web3.eth.defaultAccount, gas: 6000000});
      return this.contracts[contractName];
    }
    throw new Error(__('Unknown module %s', module));
  }
}

module.exports = Test;
