const async = require('async');
const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const utils = require('../utils/utils');
const constants = require('../constants');
const Events = require('../core/events');
const cloneDeep = require('clone-deep');

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
    this.builtContracts = {};
    this.compiledContracts = {};

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

    this.versions_default = this.engine.config.contractsConfig.versions;
    // Reset contract config to nothing to make sure we deploy only what we want
    this.engine.config.contractsConfig = {contracts: {}, versions: this.versions_default};

    this.engine.startService("libraryManager");
    this.engine.startService("codeRunner");
    this.engine.startService("web3", {
      web3: this.web3
    });
    this.engine.startService("deployment", {
      trackContracts: false,
      ipcRole: 'client'
    });
    this.engine.startService("codeGenerator");
  }

  init(callback) {
    const self = this;
    this.engine.contractsManager.build(() => {
      self.builtContracts = cloneDeep(self.engine.contractsManager.contracts);
      self.compiledContracts = cloneDeep(self.engine.contractsManager.compiledContracts);
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
      callback = function () {
      };
    }
    if (!options.contracts) {
      throw new Error(__('No contracts specified in the options'));
    }
    this.options = utils.recursiveMerge(this.options, options);
    this.simOptions = this.options.simulatorOptions || {};
    this.ready = false;

    // Reset contracts
    this.engine.contractsManager.contracts = cloneDeep(this.builtContracts);
    this.engine.contractsManager.compiledContracts = cloneDeep(this.compiledContracts);

    this._deploy(options, (err, accounts) => {
      this.ready = true;
      this.events.emit('ready');
      if (err) {
        console.error(err.red);
        return callback(err);
      }
      callback(null, accounts);
    });
  }

  _deploy(config, callback) {
    const self = this;
    async.waterfall([
      function getConfig(next) {
        self.engine.config.contractsConfig = {contracts: config.contracts, versions: self.versions_default};
        self.engine.events.emit(constants.events.contractConfigChanged, self.engine.config.contractsConfig);
        next();
      },
      function deploy(next) {
        self.engine.deployManager.gasLimit = 6000000;
        self.engine.contractsManager.gasLimit = 6000000;
        self.engine.deployManager.fatalErrors = true;
        self.engine.deployManager.deployOnlyOnConfig = true;
        self.engine.events.request('deploy:contracts', next);
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
        async.each(Object.keys(self.engine.contractsManager.contracts), (contractName, eachCb) => {
          const contract = self.engine.contractsManager.contracts[contractName];
          if (!self.contracts[contractName]) {
            self.contracts[contractName] = {};
          }
          Object.assign(self.contracts[contractName], new self.web3.eth.Contract(contract.abiDefinition, contract.deployedAddress,
            {from: self.web3.eth.defaultAccount, gas: 6000000}));
          self.contracts[contractName].address = contract.deployedAddress;
          eachCb();
        }, next);
      }
    ], function (err) {
      if (err) {
        console.log(__('terminating due to error'));
        return callback(err);
      }
      callback();
    });
  }

  require(module) {
    if (module.startsWith('Embark/contracts/')) {
      const contractName = module.substr(17);
      if (this.contracts[contractName]) {
        return this.contracts[contractName];
      }
      let contract = this.engine.contractsManager.contracts[contractName];
      if (!contract) {
        const contractNames = Object.keys(this.engine.contractsManager.contracts);
        // It is probably an instanceof
        contractNames.find(contrName => {
          // Find a contract with a similar name
          if (contractName.indexOf(contrName) > -1) {
            contract = this.engine.contractsManager.contracts[contrName];
            return true;
          }
          return false;
        });
        // If still nothing, assign bogus one, we will redefine it anyway on deploy
        if (!contract) {
          console.warn(__('Could not recognize the contract name "%s"', contractName));
          console.warn(__('If it is an instance of another contract, it will be reassigned on deploy'));
          console.warn(__('Otherwise, you can rename the contract to contain the parent contract in the name eg: Token2 for Token'));
          contract = this.engine.contractsManager.contracts[contractNames[0]];
        }
      }
      this.contracts[contractName] = new this.web3.eth.Contract(contract.abiDefinition, contract.address,
        {from: this.web3.eth.defaultAccount, gas: 6000000});
      this.contracts[contractName].address = contract.address;
      return this.contracts[contractName];
    }
    throw new Error(__('Unknown module %s', module));
  }
}

module.exports = Test;
