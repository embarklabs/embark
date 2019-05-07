import { __ } from 'embark-i18n';
import { deconstructUrl, prepareContractsConfig, AccountParser } from 'embark-utils';

const async = require('async');
const web3Utils = require('web3-utils');
import { GAS_LIMIT } from './constants';

const BALANCE_10_ETHER_IN_HEX = '0x8AC7230489E80000';

class Test {
  constructor(options) {
    this.options = options || {};
    this.simOptions = {};
    this.events = options.events;
    this.plugins = options.config.plugins;
    this.logger = options.logger;
    this.ipc = options.ipc;
    this.configObj = options.config;
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

    this.events.setCommandHandler("blockchain:provider:contract:accounts:get", cb => {
      this.events.request("blockchain:getAccounts", cb);
    });
  }

  init(callback) {
    async.waterfall([
      (next) => {
        this.events.request('runcode:ready', next);
      },
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
    if (this.simOptions.accounts) {
      this.simOptions.accounts = this.simOptions.accounts.map((account) => {
        if (!account.hexBalance) {
          account.hexBalance = BALANCE_10_ETHER_IN_HEX;
        }
        return {balance: account.hexBalance, secretKey: account.privateKey};
      });
    }

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

    this.configObj.contractsConfig.deployment = this.simOptions;
    this.configObj.contractsConfig.deployment.coverage = this.options.coverage;
    this.events.request("config:contractsConfig:set", this.configObj.contractsConfig, () => {
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
      return callback();
    }
    if (this.error) {
      return callback(this.error);
    }

    let errorCallback, readyCallback;

    errorCallback = (err) => {
      self.events.removeListener('tests:ready', readyCallback);
      callback(err);
    };

    readyCallback = () => {
      self.events.removeListener('tests:deployError', errorCallback);
      callback();
    };

    this.events.once('tests:ready', readyCallback);
    this.events.once('tests:deployError', errorCallback);
  }

  checkDeploymentOptions(options, callback) {
    const self = this;
    let resetServices = false;
    const {host, port, type, accounts} = options.deployment || {};

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

    this.events.request("blockchain:get", (web3) => {
      if (accounts) {
        self.simOptions.accounts = AccountParser.parseAccountsConfig(accounts, web3, this.dappPath);
      } else {
        self.simOptions.accounts = null;
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
        self.events.request("blockchain:ready", () => {
          self.events.request("runcode:embarkjs:reset", callback);
        });
      });
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
      self.events.emit('tests:ready');
      callback(null, accounts);
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
    async.waterfall([
      function setConfig(next) {
        prepareContractsConfig(config);
        self.events.request('config:contractsConfig:set',
          {contracts: config.contracts, versions: self.versions_default}, next);
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
      function waitForProvidersReady(accounts, web3, next) {
        self.events.request('console:provider:ready', () => {
          next(null, accounts, web3);
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
