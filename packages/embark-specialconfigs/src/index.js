/* global module require */

import { __ } from 'embark-i18n';
const stringReplaceAsync = require('string-replace-async');
const async = require('async');
const {callbackify} = require('util');

class SpecialConfigs {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embark = embark;
    this.config = embark.config;

    this.registerBeforeAllDeployAction();
    this.registerAfterDeployAction();
    this.registerBeforeDeployAction();
    this.registerOnDeployAction();
    this.registerDeployIfAction();
    this.registerAddressHandlerAction();
  }

  replaceWithENSAddress(cmd, callback) {
    const replaceWithENSAddress = (cmd) => {
      let regex = /\'[a-zA-Z0-9.]+\.eth\'/g;
      return stringReplaceAsync.seq(cmd, regex, (ensDomain) => {
        ensDomain = ensDomain.slice(1, ensDomain.length - 1);
        return (new Promise((resolve, reject) => {
          this.events.request("ens:resolve", ensDomain, (err, address) => {
            if(err) {
              return reject(new Error(err));
            }
            address = `'${address}'`;
            return resolve(address);
          });
        }));
      });
    };

    if (callback) {
      return callbackify(replaceWithENSAddress)(cmd, callback);
    }
    return replaceWithENSAddress(cmd);
  }

  replaceWithAddresses(cmd, callback) {
    const replaceWithAddresses = (cmd) => {
      let regex = /\$\w+\[?\d?\]?/g;
      return stringReplaceAsync.seq(cmd, regex, (match, index) => {
        return (new Promise((resolve, reject) => {
          if (match.startsWith('$accounts')) {
            let accountIndex = cmd.substring(index + 10, index + 12);
            accountIndex = parseInt(accountIndex, 10);
            return this.events.request('blockchain:getAccounts', (err, accounts) => {
              if (err) {
                return reject('Error getting accounts: ' + err.message || err);
              }
              if (!accounts[accountIndex]) {
                return reject(__('No corresponding account at index %d', accountIndex));
              }
              resolve(accounts[accountIndex]);
            });
          }

          let referedContractName = match.slice(1);
          this.events.request('contracts:contract', referedContractName, (referedContract) => {
            if (!referedContract) {
              this.logger.error(referedContractName + ' does not exist');
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContractDoesNotExist"));
            }
            if (referedContract && referedContract.deploy === false) {
              this.logger.error(referedContractName + " exists but has been set to not deploy");
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContracSetToNotdeploy"));
            }
            if (referedContract && !referedContract.deployedAddress) {
              this.logger.error(
                "couldn't find a valid address for " + referedContractName + ". has it been deployed?"
              );
              this.logger.error("error running cmd: " + cmd);
              return reject(new Error("ReferedContractAddressNotFound"));
            }
            return resolve(referedContract.deployedAddress);
          });
        }));
      });
    };

    if (callback) {
      return callbackify(replaceWithAddresses)(cmd, callback);
    }
    return replaceWithAddresses(cmd);
  }

  registerBeforeAllDeployAction() {
    this.embark.registerActionForEvent('deploy:beforeAll', async (cb) => {
      const beforeDeployFn = this.config.contractsConfig.beforeDeploy;
      if (!beforeDeployFn || typeof beforeDeployFn !== 'function') {
        return cb();
      }
      try {
        const logger = this.createLoggerWithPrefix('beforeDeploy >');
        await beforeDeployFn({ logger });
        cb();
      } catch (err) {
        cb(new Error(`Error running beforeDeploy hook: ${err.message}`));
      }
    });
  }

  registerAfterDeployAction() {
    this.embark.registerActionForEvent("contracts:deploy:afterAll", async (cb) => {
      if (typeof this.config.contractsConfig.afterDeploy === 'function') {
        try {
          const dependencies = await this.getAfterDeployLifecycleHookDependencies();
          await this.config.contractsConfig.afterDeploy(dependencies);
          cb();
        } catch (err) {
          return cb(new Error(`Error registering afterDeploy lifecycle hook: ${err.message}`));
        }
      } else {
        let afterDeployCmds = this.config.contractsConfig.afterDeploy || [];
        async.mapLimit(afterDeployCmds, 1, (cmd, nextMapCb) => {
          async.waterfall([
            (next) => {
              this.replaceWithAddresses(cmd, next);
            },
            this.replaceWithENSAddress.bind(this)
          ], nextMapCb);
        }, (err, onDeployCode) => {
          if (err) {
            this.logger.trace(err);
            return cb(new Error("error running afterDeploy"));
          }

          this.runOnDeployCode(onDeployCode, cb);
        });
      }
    });
  }

  runOnDeployCode(onDeployCode, callback, silent) {
    const logFunction = silent ? this.logger.trace.bind(this.logger) : this.logger.info.bind(this.logger);
    async.each(onDeployCode, (cmd, eachCb) => {
      if (!cmd) {
        return eachCb();
      }
      logFunction("==== executing: " + cmd);
      this.events.request('runcode:eval', cmd, (err) => {
        if (err && err.message.indexOf("invalid opcode") >= 0) {
          this.logger.error('the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation');
        }
        eachCb(err);
      });
    }, callback);
  }

  registerBeforeDeployAction() {
    this.embark.registerActionForEvent('deploy:contract:beforeDeploy', async (params, cb) => {
      const contract = params.contract;
      const beforeDeployFn = params.contract.beforeDeploy;
      if (!beforeDeployFn || typeof beforeDeployFn !== 'function') {
        return cb();
      }
      try {
        const dependencies = await this.getOnDeployLifecycleHookDependencies({
          contractConfig: contract,
          logPrefix: `${contract.className} > beforeDeploy >`
        });
        await beforeDeployFn(dependencies);
        cb();
      } catch (e) {
        cb(new Error(`Error running beforeDeploy hook for ${contract.className}: ${e.message || e}`));
      }
    });
  }

  registerAddressHandlerAction() {
    this.embark.registerActionForEvent('contract:address:handler', async (params, cb) => {
      const contract = params.contract;
      try {
        const dependencies = await this.getOnDeployLifecycleHookDependencies({
          contractConfig: contract,
          logPrefix: `${contract.className} > addressHandler >`
        });
        const address = await contract.addressHandler(dependencies);
        cb(null, address);
      } catch (err) {
        return cb(new Error(`Error running addressHandler for ${contract.className}: ${err.message}`));
      }
    });
  }

  registerOnDeployAction() {
    this.embark.registerActionForEvent("deploy:contract:deployed", async (params, cb) => {
      let contract = params.contract;

      if (!contract.onDeploy || contract.deploy === false) {
        return cb();
      }

      if (!contract.silent) {
        this.logger.info(__('executing onDeploy commands'));
      }

      if (typeof contract.onDeploy === 'function') {
        try {
          const dependencies = await this.getOnDeployLifecycleHookDependencies({
            contractConfig: contract,
            logPrefix: `${contract.className} > onDeploy >`
          });
          await contract.onDeploy(dependencies);
          cb();
        } catch (err) {
          return cb(new Error(`Error when registering onDeploy hook for ${contract.className}: ${err.message}`));
        }
      } else {
        let onDeployCmds = contract.onDeploy;
        async.mapLimit(onDeployCmds, 1, (cmd, nextMapCb) => {
          async.waterfall([
            (next) => {
              this.replaceWithAddresses(cmd, next);
            },
            this.replaceWithENSAddress.bind(this)
          ], (err, code) => {
            if (err) {
              this.logger.error(err.message || err);
              return nextMapCb(); // Don't return error as we just skip the failing command
            }
            nextMapCb(null, code);
          });
        }, (err, onDeployCode) => {
          if (err) {
            return cb(new Error("error running onDeploy for " + contract.className.cyan));
          }

          this.runOnDeployCode(onDeployCode, cb, contract.silent);
        });
      }
    });
  }

  registerDeployIfAction() {
    this.embark.registerActionForEvent("deploy:contract:shouldDeploy", async (params, cb) => {
      let cmd = params.contract.deployIf;
      const contract = params.contract;
      if (!cmd) {
        return cb(null, params);
      }

      if (typeof cmd === 'function') {
        try {
          const dependencies = await this.getOnDeployLifecycleHookDependencies({
            contractConfig: contract,
            logPrefix: `${contract.className} > deployIf >`
          });
          params.shouldDeploy = await contract.deployIf(dependencies);
          cb(null, params);
        } catch (err) {
          return cb(new Error(`Error when registering deployIf hook for ${contract.className}: ${err.message}`));
        }
      } else {

        this.events.request('runcode:eval', cmd, (err, result) => {
          if (err) {
            this.logger.error(params.contract.className + ' deployIf directive has an error; contract will not deploy');
            this.logger.error(err.message || err);
            params.shouldDeploy = false;
          } else if (!result) {
            this.logger.info(params.contract.className + ' deployIf directive returned false; contract will not deploy');
            params.shouldDeploy = false;
          }

          cb(null, params);
        });
      }
    });
  }

  getOnDeployLifecycleHookDependencies(options) {
    let contractConfig = options.contractConfig;
    let dependencyNames = contractConfig.deps || [];
    dependencyNames.push(contractConfig.className);
    dependencyNames = [...new Set(dependencyNames)];

    return new Promise((resolve, reject) => {
      async.map(dependencyNames, (contractName, next) => {
        this.events.request('contracts:contract', contractName, (contractRecipe) => {
          if (!contractRecipe) {
            next(new Error(`ReferredContractDoesNotExist: ${contractName}`));
          }
          this.events.request('blockchain:contract:create', {
            abi: contractRecipe.abiDefinition,
            address: contractRecipe.deployedAddress
          }, contractInstance => {
            next(null, { className: contractRecipe.className, instance: contractInstance });
          });
        });
      }, (err, contractInstances) => {
        if (err) {
          reject(err);
        }
        this.events.request('blockchain:get', web3 => {
          const logger = this.createLoggerWithPrefix(options.logPrefix);
          resolve(this.assembleLifecycleHookDependencies(contractInstances, web3, logger));
        });
      });
    });
  }

  getAfterDeployLifecycleHookDependencies() {
    return new Promise((resolve, reject) => {
      this.events.request('contracts:list', (err, contracts) => {
        async.map(contracts, (contract, next) => {
          this.events.request('blockchain:contract:create', {
            abi: contract.abiDefinition,
            address: contract.deployedAddress
          }, contractInstance => {
            next(null, { className: contract.className, instance: contractInstance });
          });
        }, (err, contractInstances) => {
          if (err) {
            reject(err);
          }
          this.events.request('blockchain:get', web3 => {
            const logger = this.createLoggerWithPrefix('afterDeploy >');
            resolve(this.assembleLifecycleHookDependencies(contractInstances, web3, logger));
          });
        });
      });
    });
  }

  assembleLifecycleHookDependencies(contractInstances, web3, logger) {
    return contractInstances.reduce((dependencies, contractInstance) => {
      dependencies.contracts[contractInstance.className] = contractInstance.instance;
      return dependencies;
    }, { contracts: {}, web3, logger });
  }

  createLoggerWithPrefix(prefix) {
    const logger = {
      log: createLogWithPrefixFn(this.logger, 'log', prefix),
      warn: createLogWithPrefixFn(this.logger, 'warn', prefix),
      error: createLogWithPrefixFn(this.logger, 'error', prefix),
      info: createLogWithPrefixFn(this.logger, 'info', prefix),
      dir: createLogWithPrefixFn(this.logger, 'dir', prefix),
      debug: createLogWithPrefixFn(this.logger, 'debug', prefix)
    };
    return logger;
  }
}

function createLogWithPrefixFn(logger, method, prefix) {
  return function () {
    const args = Array.from(arguments).map(arg => `${prefix} ${arg}`);
    args.forEach(arg => logger[method](arg));
  };
}

module.exports = SpecialConfigs;
