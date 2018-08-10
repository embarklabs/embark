const async = require('async');
const Engine = require('../core/engine.js');
const TestLogger = require('./test_logger.js');
const Web3 = require('web3');
const Events = require('../core/events');
const AccountParser = require('../utils/accountParser');
// TODO: breaks module isolation; tests need to be refactored to use the engine and avoid this
const Provider = require('../modules/blockchain_connector/provider.js');
const utils = require('../utils/utils');

const EmbarkJS = require('embarkjs');

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
    this.events = new Events();
    this.ready = true;
    this.firstRunConfig = true;
    this.error = false;
    this.contracts = {};
    this.firstDeployment = true;
    this.logsSubscription = null;
    this.needConfig = true;
    this.web3 = new Web3();
  }

  initWeb3Provider(callback) {
    const self = this;
    if (this.provider) {
      this.provider.stop();
    }

    if (this.simOptions.accounts) {
      this.simOptions.accounts = this.simOptions.accounts.map((account) => {
        if (!account.hexBalance) {
          account.hexBalance = '0x8AC7230489E80000'; // 10 ether
        }
        return {balance: account.hexBalance, secretKey: account.privateKey};
      });
    }

    if (this.simOptions.host) {
      let {host, port, type, protocol, accounts} = this.simOptions;
      if (!protocol) {
        protocol = (this.simOptions.type === "rpc") ? 'http' : 'ws';
      }
      const endpoint = `${protocol}://${host}:${port}`;
      const providerOptions = {
        web3: this.web3,
        type,
        accountsConfig: accounts,
        blockchainConfig: this.engine.config.blockchainConfig,
        logger: this.engine.logger,
        isDev: false,
        web3Endpoint: endpoint
      };
      console.info(`Connecting to node at ${endpoint}`.cyan);

      return utils.pingEndpoint(host, port, type, protocol, this.engine.config.blockchainConfig.wsOrigins.split(',')[0], (err) => {
        if (err) {
          console.error(`Error connecting to the node, there might be an error in ${endpoint}`.red);
          return callback(err);
        }

        self.provider = new Provider(providerOptions);
        return self.provider.startWeb3Provider((err) => {
          if (err) {
            return callback(err);
          }
          callback();
        });
      });
    }

    if (!this.sim) {
      this.sim = getSimulator();
    }
    this.web3.setProvider(this.sim.provider(this.simOptions));
    callback();
  }

  initDeployServices() {
    this.engine.startService("web3", {
      web3: this.web3
    });
    this.engine.startService("deployment", {
      trackContracts: false
    });
    this.events.request('deploy:setGasLimit', 6000000);
    this.engine.startService("codeCoverage");
  }

  init(callback) {
    this.engine = new Engine({
      env: this.options.env || 'test',
      // TODO: config will need to detect if this is a obj
      embarkConfig: this.options.embarkConfig || 'embark.json',
      interceptLogs: false,
      ipcRole: 'client'
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

    callback();
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

  checkDeploymentOptions(options, callback) {
    const self = this;
    let resetServices = false;
    const {host, port, type, accounts} = options.deployment || {};

    if (host && port && !['rpc', 'ws'].includes(type)) {
      callback(__("contracts config error: unknown deployment type %s", type));
    }

    if(accounts || port !== this.simOptions.port || type !== this.simOptions.type || host !== this.simOptions.host) {
      resetServices = true;
    }
    if (accounts) {
      self.simOptions.accounts = AccountParser.parseAccountsConfig(accounts, self.web3);
    } else {
      self.simOptions.account = null;
    }

    Object.assign(self.simOptions, {
      host,
      port,
      type
    });

    if (!resetServices && !self.firstRunConfig) {
      return callback();
    }

    self.initWeb3Provider((err) => {
      if (err) {
        return callback(err);
      }
      self.firstRunConfig = false;
      self.initDeployServices();
      callback();
    });
  }

  config(options, callback) {
    const self = this;
    self.needConfig = false;
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
      function checkDeploymentOpts(next) {
        self.checkDeploymentOptions(options, next);
      },
      function compileContracts(next) {
        if (!self.firstDeployment) {
          return next();
        }
        console.info('Compiling contracts'.cyan);
        self.engine.events.request("contracts:build", false, (err) => {
          self.firstDeployment = false;
          next(err);
        });
      },
      function resetContracts(next) {
        self.engine.events.request("contracts:reset:dependencies", next);
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
    ], (err, accounts) => {
      if (err) {
        process.exit(1);
      }
      callback(null, accounts);
    });
  }

  _deploy(config, callback) {
    const self = this;
    async.waterfall([
      function getConfig(next) {
        self.engine.config.contractsConfig = {contracts: config.contracts, versions: self.versions_default};
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
        }).catch((err) => {
          next(err);
        });
      },
      function deploy(accounts, next) {
        self.engine.events.request('deploy:contracts:test', () => {
          next(null, accounts);
        });
      },
      function createContractObject(accounts, next) {
        self.engine.events.request('contracts:all', (err, contracts) => {

          async.each(contracts, (contract, eachCb) => {
            if (!self.contracts[contract.className]) {
              self.contracts[contract.className] = {};
            }

            let newContract = new EmbarkJS.Contract({
              abi: contract.abiDefinition,
              address: contract.deployedAddress,
              from: self.web3.eth.defaultAccount,
              gas: 6000000,
              web3: self.web3
            });

            if (newContract.options) {
              newContract.options.from = self.web3.eth.defaultAccount;
              newContract.options.data = contract.code;
              newContract.options.gas = 6000000;
            }

            Object.setPrototypeOf(self.contracts[contract.className], newContract);
            Object.assign(self.contracts[contract.className], newContract);

            eachCb();
          }, (err) => {
            next(err, accounts);
          });

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

  require(path) {
    const prefix = 'Embark/contracts/';
    if (!path.startsWith(prefix)) {
      throw new Error(__('Unknown module %s', path));
    }
    let contractName = path.replace(prefix, "");
    let contract = this.contracts[contractName];
    if (contract) {
      return contract;
    }

    let newContract = {};
    this.contracts[contractName] = newContract;
    return newContract;
  }
}

module.exports = Test;
