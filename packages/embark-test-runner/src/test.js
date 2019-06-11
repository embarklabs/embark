import { __ } from 'embark-i18n';
import { deconstructUrl, prepareContractsConfig, buildUrl, recursiveMerge } from 'embark-utils';
import deepEqual from 'deep-equal';
import cloneDeep from 'lodash.clonedeep';

const async = require('async');
const web3Utils = require('web3-utils');
import { GAS_LIMIT } from './constants';

class Test {
  constructor(options) {
    this.options = options || {};
    this.simOptions = {};
    this.events = options.events;
    this.plugins = options.config.plugins;
    this.logger = options.logger;
    this.ipc = options.ipc;
    this.configObj = options.config;
    this.originalConfigObj = cloneDeep(options.config);
    this.ready = true;
    this.firstRunConfig = true;
    this.error = false;
    this.contracts = {};
    this.firstDeployment = true;
    this.needConfig = true;
    this.provider = null;
    this.accounts = [];
    this.embarkjs = {};
    this.dappPath = options.dappPath;
    this.moduleConfigs = {
      namesystem: {},
      storage: {},
      communication: {}
    };

    this.events.setCommandHandler("blockchain:provider:contract:accounts:get", cb => {
      this.events.request("blockchain:getAccounts", cb);
    });
  }

  init(callback) {
    async.waterfall([
      (next) => {
        this.gasLimit = GAS_LIMIT;
        this.events.request('deploy:setGasLimit', this.gasLimit);
        if (this.options.node !== 'embark') {
          this.showNodeHttpWarning();
          return next();
        }
        if (!this.ipc.connected) {
          this.logger.error("Could not connect to Embark's IPC. Is embark running?");
          if (!this.options.inProcess) process.exit(1);
        }
        return this.connectToIpcNode(next);
      }
    ], callback);
  }

  connectToIpcNode(cb) {
    this.ipc.request('blockchain:node', {}, (err, node) => {
      if (err) {
        this.logger.error(err.message || err);
        return cb();
      }
      this.options.node = node;
      this.showNodeHttpWarning();
      cb();
    });
  }

  initWeb3Provider(callback) {
    if (!this.simOptions.host && (this.options.node && this.options.node === 'vm')) {
      this.simOptions.type = 'vm';
    } else if (this.simOptions.host || (this.options.node && this.options.node !== 'vm')) {
      let options = this.simOptions;
      if (this.options.node && this.options.node !== 'vm') {
        options = deconstructUrl(this.options.node);
      }

      if (!options.protocol) {
        options.protocol = (options.type === "rpc") ? 'http' : 'ws';
      }
      Object.assign(this.simOptions, options);
    }

    this.configObj.blockchainConfig.endpoint = this.simOptions.host ? buildUrl(this.simOptions.protocol, this.simOptions.host, this.simOptions.port, this.simOptions.type) : null;
    this.configObj.blockchainConfig.type = this.simOptions.type;
    this.configObj.blockchainConfig.accounts = this.simOptions.accounts;
    this.configObj.blockchainConfig.coverage = this.options.coverage;
    this.logger.trace('Setting blockchain configs:', this.configObj.blockchainConfig);
    this.events.request('config:blockchainConfig:set', this.configObj.blockchainConfig, () => {
      this.events.request('blockchain:reset', (err) => {
        if (err) {
          this.logger.error('Error restarting the blockchain connection');
        }
        callback(err);
      });
    });

  }

  showNodeHttpWarning() {
    if (this.options.node.startsWith('http')) {
      this.logger.warn("You are using http to connect to the node, as a result the gas details won't be correct." +
        " For correct gas details reporting, please use a websockets connection to your node.");
    }
  }

  onReady(callback) {
    const self = this;
    if (this.ready) {
      return setImmediate(() => {
        callback(null, this.accounts);
      });
    }
    if (this.error) {
      return setImmediate(() => {
        callback(this.error);
      });
    }

    let errorCallback, readyCallback;

    errorCallback = (err) => {
      self.events.removeListener('tests:ready', readyCallback);
      callback(err);
    };

    readyCallback = (accounts) => {
      self.events.removeListener('tests:deployError', errorCallback);
      callback(null, accounts);
    };

    this.events.once('tests:ready', readyCallback);
    this.events.once('tests:deployError', errorCallback);
  }

  checkDeploymentOptions(options, callback) {
    let resetServices = false;
    const blockchainConfig = options.blockchain || {};
    const {host, port, type, protocol} = blockchainConfig.endpoint ? deconstructUrl(blockchainConfig.endpoint) : {};
    const accounts = blockchainConfig.accounts;

    if (host && port && !['rpc', 'ws'].includes(type)) {
      return callback(__("contracts config error: unknown deployment type %s", type));
    }

    if (this.options.coverage && type === 'rpc') {
      this.logger.warn(__('Coverage does not work with an RPC node'));
      this.logger.warn(__('You can change to a WS node (`"type": "ws"`) or use the simulator (no node or `"type": "vm"`)'));
    }

    if (accounts || (port && port !== this.simOptions.port) || (type && type !== this.simOptions.type) ||
      (host && host !== this.simOptions.host)) {
      resetServices = true;
    }

    Object.assign(this.simOptions, {host, port, type, protocol});
    this.simOptions.accounts = accounts;

    if (!resetServices && !this.firstRunConfig) {
      return callback();
    }

    this.initWeb3Provider((err) => {
      if (err) {
        return callback(err);
      }
      this.firstRunConfig = false;
      this.events.request("blockchain:ready", () => {
        this.events.request("code-generator:embarkjs:build", () => {
          this.events.request("runcode:embarkjs:reset", callback);
        });
      });
    });
  }

  checkModuleConfigs(options, callback) {
    const self = this;
    const restartModules = [];

    Object.keys(this.moduleConfigs).forEach(moduleName => {
      options[moduleName] = options[moduleName] || {};
      if (!deepEqual(options[moduleName], this.moduleConfigs[moduleName])) {
        this.moduleConfigs[moduleName] = options[moduleName];
        restartModules.push((paraCb) => {
          self.events.request(`config:${moduleName}Config:set`, recursiveMerge({}, self.originalConfigObj[`${moduleName}Config`], options[moduleName]), () => {
            self.events.request(`module:${moduleName}:reset`, paraCb);
          });
        });
      }
    });

    async.parallel(restartModules, (err, _result) => {
      callback(err);
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
      options.contracts = {deploy: {}};
    } else if (!options.contracts.deploy) {
      // Check if it is the old syntax
      let isOldSyntax = false;
      Object.values(options.contracts).find(value => {
        if (typeof value === 'string' || typeof value === 'number') {
          isOldSyntax = true;
          return true;
        }
        if (value.args) {
          isOldSyntax = true;
          return true;
        }
      });
      if (isOldSyntax) {
        this.logger.error(__('The contract configuration for tests has changed. Please use the following structure: `contracts: {deploy: MyContract: {}}}`\nFor more details: %s',
          'https://embark.status.im/docs/contracts_testing.html#Configuring-Smart-Contracts-for-tests'.underline));
        process.exit(1);
      }
    }
    self.ready = false;

    async.waterfall([
      function cleanContracts(next) {
        Object.keys(self.contracts).forEach(contractName => {
          if (self.contracts[contractName]._requestManager) {
            // Remove all data listeners from the contract provider as a listener for `data` is added for each new contract
            // Removing directly as contract.removeSubscriptions throws errors and doesn't really unsubscribe
            self.contracts[contractName]._requestManager.provider.removeAllListeners('data');
          }
        });
        next();
      },
      function checkDeploymentOpts(next) {
        self.checkDeploymentOptions(options, next);
      },
      function checkModuleConfigs(next) {
        self.checkModuleConfigs(options, next);
      },
      function prepareContracts(next) {
        if (!self.firstDeployment || !self.options.coverage) {
          return next();
        }
        console.info('Preparing contracts for coverage'.cyan);
        self.events.request("coverage:prepareContracts", next);
      },
      function compileContracts(next) {
        if (!self.firstDeployment) {
          return next();
        }
        console.info('Compiling contracts'.cyan);
        self.events.request("contracts:build", false, (err) => {
          self.firstDeployment = false;
          console.info('Compilation done\n'.cyan);
          next(err);
        });
      },
      function resetContracts(next) {
        self.events.request("contracts:reset:dependencies", next);
      },
      function deploy(next) {
        self._deploy(options, (err, accounts) => {
          if (err) {
            self.events.emit('tests:deployError', err);
            self.error = err;
            return next(err);
          }
          self.ready = true;
          self.error = false;
          next(null, accounts);
        });
      }
    ], (err, accounts) => {
      if (err) {
        // TODO Do not exit in case of not a normal run (eg after a change)
        if (!self.options.inProcess) process.exit(1);
      }
      self.accounts = accounts;
      callback(null, accounts);
      self.events.emit('tests:ready', accounts);
    });
  }

  async deploy(contract, deployArgs = {}, sendArgs = {}) {
    const instance = await contract.deploy(deployArgs).send(sendArgs);
    this.events.emit("tests:manualDeploy", instance);
    return instance;
  }

  track(jsonInterface, address) {
    this.events.request('blockchain:get', (web3) => {
      const instance = new web3.eth.Contract(jsonInterface, address);
      this.events.emit("tests:manualDeploy", instance);
    });
  }

  async _deploy(config, callback) {
    const self = this;
    let contractConfig = config.contracts || {};
    async.waterfall([
      function setConfig(next) {
        contractConfig = prepareContractsConfig(contractConfig);
        self.events.request('config:contractsConfig:set',
          {contracts: contractConfig.contracts}, next);
      },
      function getAccounts(next) {
        self.events.request('blockchain:getAccounts', (err, accounts) => {
          if (err) {
            return next(err);
          }
          self.accounts = accounts;
          self.events.request('blockchain:defaultAccount:set', accounts[0], () => {
            next(null, accounts);
          });
        });
      },
      function getBalance(accounts, next) {
        self.events.request('blockchain:getBalance', self.accounts[0], (err, balance) => {
          if (err) {
            return next(err);
          }
          if (web3Utils.toBN(balance).eq(web3Utils.toBN(0))) {
            self.logger.warn("Warning: default account has no funds");
          }
          next(null, accounts);
        });
      },
      function getWeb3Object(accounts, next) {
        self.events.request('blockchain:get', (web3) => {
          // global web3 used in the tests, not in the vm
          global.web3 = web3;
          next(null, accounts, web3);
        });
      },
      function deploy(accounts, web3, next) {
        self.events.request('deploy:contracts:test', (err) => {
          next(err, accounts, web3);
        });
      },
      function createContractObject(accounts, web3, next) {
        self.events.request('contracts:all', (err, contracts) => {
          async.each(contracts, (contract, eachCb) => {
            if (!self.contracts[contract.className]) {
              self.contracts[contract.className] = {};
            }

            const testContractFactoryPlugin = self.plugins.getPluginsFor('testContractFactory').slice(-1)[0];

            if (testContractFactoryPlugin) {
              const newContract = testContractFactoryPlugin.testContractFactory(contract, web3);
              Object.setPrototypeOf(self.contracts[contract.className], newContract);
              return eachCb();
            }
            self.getEmbarkJSContract(contract, (err, vmContract) => {
              if(err) {
                self.logger.error(`Erroring creating contract instance '${contract.className}' for import in to test. Error: ${err}`);
              }
              Object.setPrototypeOf(self.contracts[contract.className], vmContract || null);
              eachCb();
            });
          }, (err) => {
            next(err, accounts);
          });

        });
      },
      function updateEmbarkJsRef(accounts, next) {
        self.events.request("runcode:eval", "EmbarkJS", (err, embarkjs) => {
          if (!err && embarkjs) {
            Object.setPrototypeOf(self.embarkjs, embarkjs);
          }
          next(err, accounts);
        });
      }
    ], function (err, accounts) {
      if (err) {
        self.logger.error(__('terminating due to error'));
        self.logger.error(err.message || err);
        return callback(err);
      }
      callback(null, accounts);
    });
  }

  getEmbarkJSContract(contract, cb) {
    const codeToRun = `
      const newContract = new EmbarkJS.Blockchain.Contract({
        abi: ${JSON.stringify(contract.abiDefinition)},
        address: "${contract.deployedAddress || ""}" || undefined,
        from: "${contract.deploymentAccount || ""}" || web3.eth.defaultAccount,
        gas: "${GAS_LIMIT}",
        web3: web3
      });

      newContract.filename = "${contract.filename}";
      if (newContract.options) {
        newContract.options.from = "${contract.deploymentAccount || ""}" || web3.eth.defaultAccount;
        newContract.options.data = "${contract.code}";
        if (newContract.options.data && !newContract.options.data.startsWith('0x')) {
          newContract.options.data = '0x' + newContract.options.data;
        }
        newContract.options.gas = "${GAS_LIMIT}";
      }
      return newContract;`;
    this.events.request("runcode:eval", codeToRun, cb, false, true);
  }

  require(path) {
    const [contractsPrefix, embarkJSPrefix] = ['Embark/contracts/', 'Embark/EmbarkJS'];

    // Contract require
    if (path.startsWith(contractsPrefix)) {
      const contractName = path.replace(contractsPrefix, "");
      const contract = this.contracts[contractName];
      if (contract) {
        return contract;
      }

      const newContract = {};
      this.contracts[contractName] = newContract;
      return newContract;
    }

    // EmbarkJS require
    if (path.startsWith(embarkJSPrefix)) {
      return this.embarkjs;
    }

    throw new Error(__('Unknown module %s', path));
  }
}

module.exports = Test;
