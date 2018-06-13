const async = require('async');
const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const constants = require('../constants');
const Events = require('../core/events');
const cloneDeep = require('clone-deep');
const AccountParser = require('../contracts/accountParser');
const Provider = require('../contracts/provider');

const EmbarkJS = require('../../js/embark_node');

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
    this.simOptions = {};
    this.contracts = {};
    this.events = new Events();
    this.ready = true;
    this.error = false;
    this.builtContracts = {};
    this.compiledContracts = {};

    this.web3 = new Web3();
  }

  initWeb3Provider(callback) {
    if (this.simOptions.host) {
      const providerOptions = {
        web3: this.web3,
        accountsConfig: this.simOptions.accounts,
        logger: this.engine.logger,
        isDev: false,
        web3Endpoint: 'http://' + this.simOptions.host + ':' + this.simOptions.port
      };
      this.provider = new Provider(providerOptions);
      return this.provider.startWeb3Provider(callback);
    }

    if (this.simOptions.accounts) {
      this.simOptions.accounts = this.simOptions.accounts.map((account) => {
        return {balance: account.hexBalance, secretKey: account.privateKey};
      });
    }
    this.sim = getSimulator();
    this.web3.setProvider(this.sim.provider(this.simOptions));
    callback();
  }

  initDeployServices() {
    this.engine.startService("web3", {
      web3: this.web3
    });
    this.engine.startService("deployment", {
      trackContracts: false,
      ipcRole: 'client'
    });
  }

  init(callback) {
    const self = this;

    this.initWeb3Provider((err) => {
      if (err) {
        return callback(err);
      }
      this.engine = new Engine({
        env: this.options.env || 'test',
        // TODO: config will need to detect if this is a obj
        embarkConfig: this.options.embarkConfig || 'embark.json',
        interceptLogs: false
      });

      this.engine.init({
        logger: new TestLogger({logLevel: this.options.loglevel})
      });

      this.versions_default = this.engine.config.contractsConfig.versions;
      // Reset contract config to nothing to make sure we deploy only what we want
      this.engine.config.contractsConfig = {
        contracts: {},
        versions: this.versions_default
      };

      this.engine.startService("libraryManager");
      this.engine.startService("codeRunner");
      this.initDeployServices();
      this.engine.startService("codeGenerator");

      this.engine.contractsManager.build(() => {
        self.builtContracts = cloneDeep(self.engine.contractsManager.contracts);
        self.compiledContracts = cloneDeep(self.engine.contractsManager.compiledContracts);
        callback();
      });
    });
  }

  onReady(callback) {
    const self = this;
    if (this.ready) {
      return callback();
    }
    if (this.error) {
      return callback(this.error);
    }

    let errorCallback, readyCallback;

    errorCallback = (err) => {
      self.events.removeListener('ready', readyCallback);
      callback(err);
    };

    readyCallback = () => {
      self.events.removeListener('deployError', errorCallback);
      callback();
    };

    this.events.once('ready', readyCallback);
    this.events.once('deployError', errorCallback);
  }

  config(options, callback) {
    const self = this;
    if (typeof (options) === 'function') {
      callback = options;
      options = {};
    }
    if (!callback) {
      callback = function () {
      };
    }
    if (!options.contracts) {
      options.contracts = {};
    }
    self.ready = false;

    async.waterfall([
      function checkDeploymentOptions(next) {
        if (!options.deployment) {
          if (!self.simOptions.host && !self.simOptions.accounts) {
            return next();
          }
          self.simOptions = {};
        } else {
          self.simOptions = {};
          let resetServices = false;
          if (options.deployment.accounts) {
            // Account setup
            self.simOptions.accounts = AccountParser.parseAccountsConfig(options.deployment.accounts, self.web3);
            resetServices = true;
          }
          if (options.deployment.host && options.deployment.port && options.deployment.type) {
            if (options.deployment.type !== 'rpc') {
              throw new Error(__("contracts config error: unknown deployment type %s", options.deployment.type));
            }
            Object.assign(self.simOptions, {host: options.deployment.host, port: options.deployment.port});
            resetServices = true;
          }
          if (!resetServices) {
            return next();
          }
        }
        self.initWeb3Provider((err) => {
          if (err) {
            return next(err);
          }
          self.initDeployServices();
          next();
        });
      },
      function resetContracts(next) {
        self.engine.contractsManager.contracts = cloneDeep(self.builtContracts);
        self.engine.contractsManager.compiledContracts = cloneDeep(self.compiledContracts);
        next();
      },
      function deploy(next) {
        self._deploy(options, (err, accounts) => {
          if (err) {
            self.events.emit('deployError', err);
            self.error = err;
            return next(err);
          }
          self.ready = true;
          self.error = false;
          self.events.emit('ready');
          next(null, accounts);
        });
      }
    ], callback);
  }

  _deploy(config, callback) {
    const self = this;
    async.waterfall([
      function getConfig(next) {
        self.engine.config.contractsConfig = {contracts: config.contracts, versions: self.versions_default};
        self.engine.events.emit(constants.events.contractConfigChanged, self.engine.config.contractsConfig);
        next();
      },
      function getAccounts(next) {
        self.web3.eth.getAccounts(function (err, accounts) {
          if (err) {
            return next(err);
          }
          self.accounts = accounts;
          self.web3.eth.defaultAccount = accounts[0];
          next(null, accounts);
        });
      },
      function getBalance(accounts, next) {
        self.web3.eth.getBalance(self.web3.eth.defaultAccount).then((balance) => {
          if (parseInt(balance, 10) === 0) {
            console.warn("Warning: default account has no funds");
          }
          next(null, accounts);
        }).catch((err) => { next(err); });
      },
      function deploy(accounts, next) {
        self.engine.deployManager.gasLimit = 6000000;
        self.engine.contractsManager.gasLimit = 6000000;
        self.engine.deployManager.fatalErrors = true;
        self.engine.deployManager.deployOnlyOnConfig = true;
        self.engine.events.request('deploy:contracts', () => {
          next(null, accounts);
        });
      },
      function createContractObject(accounts, next) {
        async.each(Object.keys(self.engine.contractsManager.contracts), (contractName, eachCb) => {
          const contract = self.engine.contractsManager.contracts[contractName];
          let data;
          if (!self.contracts[contractName]) {
            self.contracts[contractName] = {};
            data = "";
          } else {
            data = self.contracts[contractName].options.data;
          }
          Object.assign(self.contracts[contractName], new EmbarkJS.Contract({abi: contract.abiDefinition, address: contract.deployedAddress, from: self.web3.eth.defaultAccount, gas: 6000000, web3: self.web3}));

          self.contracts[contractName].address = contract.deployedAddress;
          if (self.contracts[contractName].options) {
            self.contracts[contractName].options.from = self.contracts[contractName].options.from || self.web3.eth.defaultAccount;
            self.contracts[contractName].options.data = data;
            self.contracts[contractName].options.gas = 6000000;
          }
          eachCb();
        }, (err) => {
          next(err, accounts);
        });
      }
    ], function (err, accounts) {
      if (err) {
        console.log(__('terminating due to error'));
        return callback(err);
      }
      callback(null, accounts);
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
      this.contracts[contractName] = new EmbarkJS.Contract({abi: contract.abiDefinition, address: contract.address, from: this.web3.eth.defaultAccount, gas: 6000000, web3: this.web3});
      this.contracts[contractName].address = contract.address;
      this.contracts[contractName].options.data = contract.code;
      this.contracts[contractName].options.gas = 6000000;
      this.web3.eth.getAccounts().then((accounts) => {
        this.contracts[contractName].options.from = contract.from || accounts[0];
      });
      return this.contracts[contractName];
    }
    throw new Error(__('Unknown module %s', module));
  }
}

module.exports = Test;
