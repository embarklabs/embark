const stringReplaceAsync = require("string-replace-async");
const async = require("async");

class SpecialConfigs {
  private logger: any;
  private events: any;
  private buildDir: any;
  private embark: any;
  private config: any;

  constructor(embark: any, options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embark = embark;
    this.config = embark.config;

    this.registerAfterDeployAction();
    this.registerOnDeployAction();
    this.registerDeployIfAction();
  }

  private replaceWithENSAddress(cmd: any, cb: any) {
    const regex = /\"[a-zA-Z0-9.]+\.eth\"/g;
    return stringReplaceAsync.seq(cmd, regex, (ensDomain: any) => {
      ensDomain = ensDomain.slice(1, ensDomain.length - 1);
      return (new Promise((resolve: any, reject: any) => {
        this.events.request("ens:resolve", ensDomain, (err: any, address: any) => {
          if (err) {
            return reject(new Error(err));
          }
          address = `"${address}"`;
          return resolve(address);
        });
      }));
    }).then((address: any) => {
      cb(null, address);
    }).catch(cb);
  }

  private replaceWithAddresses(cmd: any, cb: any) {
    const regex = /\$\w+\[?\d?\]?/g;
    stringReplaceAsync.seq(cmd, regex, (match: any, index: any) => {
      return (new Promise((resolve: any, reject: any) => {
        if (match.startsWith("$accounts")) {
          let accountIndex = cmd.substring(index + 10, index + 12);
          accountIndex = parseInt(accountIndex, 10);
          return this.events.request("blockchain:getAccounts", (err: any, accounts: any) => {
            if (err) {
              return reject("Error getting accounts: " + err.message || err);
            }
            if (!accounts[accountIndex]) {
              return reject(__("No corresponding account at index %d", accountIndex));
            }
            resolve(accounts[accountIndex]);
          });
        }

        const referedContractName = match.slice(1);
        this.events.request("contracts:contract", referedContractName, (referedContract: any) => {
          if (!referedContract) {
            this.logger.error(referedContractName + " does not exist");
            this.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContractDoesNotExist"));
          }
          if (referedContract && referedContract.deploy === false) {
            this.logger.error(referedContractName + " exists but has been set to not deploy");
            this.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContracSetToNotdeploy"));
          }
          if (referedContract && !referedContract.deployedAddress) {
            this.logger.error("couldn\"t find a valid address for " + referedContractName + ". has it been deployed?");
            this.logger.error("error running cmd: " + cmd);
            return reject(new Error("ReferedContractAddressNotFound"));
          }
          return resolve(referedContract.deployedAddress);
        });
      }));
    }).then((address: any) => {
      cb(null, address);
    }).catch(cb);
  }

  private registerAfterDeployAction() {
    const self = this;

    this.embark.registerActionForEvent("contracts:deploy:afterAll", async (cb: any) => {
      if (typeof self.config.contractsConfig.afterDeploy === "function") {
        try {
          const dependencies = await this.getAfterDeployLifecycleHookDependencies();
          await self.config.contractsConfig.afterDeploy(dependencies);
          cb();
        } catch (err) {
          return cb(new Error(`Error registering afterDeploy lifecycle hook: ${err.message}`));
        }
      } else {
        const afterDeployCmds = self.config.contractsConfig.afterDeploy || [];
        async.mapLimit(afterDeployCmds, 1, (cmd: any, nextMapCb: any) => {
          async.waterfall([
            function replaceWithAddresses(next: any) {
              self.replaceWithAddresses(cmd, next);
            },
            self.replaceWithENSAddress.bind(self),
          ], nextMapCb);
        }, (err: any, onDeployCode: any) => {
          if (err) {
            self.logger.trace(err);
            return cb(new Error("error running afterDeploy"));
          }

          self.runOnDeployCode(onDeployCode, cb);
        });
      }
    });
  }

  private runOnDeployCode(onDeployCode: any, callback: any, silent?: boolean) {
    const logFunction = silent ? this.logger.trace.bind(this.logger) : this.logger.info.bind(this.logger);
    async.each(onDeployCode, (cmd: any, eachCb: any) => {
      if (!cmd) {
        return eachCb();
      }
      logFunction("==== executing: " + cmd);
      this.events.request("runcode:eval", cmd, (err: any) => {
        if (err && err.message.indexOf("invalid opcode") >= 0) {
          this.logger.error("the transaction was rejected; this usually happens due to a throw or a require, it can also happen due to an invalid operation");
        }
        eachCb(err);
      });
    }, callback);
  }

  private registerOnDeployAction() {
    const self = this;

    this.embark.registerActionForEvent("deploy:contract:deployed", async (params: any, cb: any) => {
      const contract = params.contract;

      if (!contract.onDeploy || contract.deploy === false) {
        return cb();
      }

      if (!contract.silent) {
        self.logger.info(__("executing onDeploy commands"));
      }

      if (typeof contract.onDeploy === "function") {
        try {
          const dependencies = await this.getOnDeployLifecycleHookDependencies(contract);
          await contract.onDeploy(dependencies);
          cb();
        } catch (err) {
          return cb(new Error(`Error when registering onDeploy hook for ${contract.name}: ${err.message}`));
        }
      } else {
        const onDeployCmds = contract.onDeploy;
        async.mapLimit(onDeployCmds, 1, (cmd: any, nextMapCb: any) => {
          async.waterfall([
            function replaceWithAddresses(next: any) {
              self.replaceWithAddresses(cmd, next);
            },
            self.replaceWithENSAddress.bind(self),
          ], (err: any, code: any) => {
            if (err) {
              self.logger.error(err.message || err);
              return nextMapCb(); // Don"t return error as we just skip the failing command
            }
            nextMapCb(null, code);
          });
        }, (err: any, onDeployCode: any) => {
          if (err) {
            return cb(new Error("error running onDeploy for " + contract.className.cyan));
          }

          self.runOnDeployCode(onDeployCode, cb, contract.silent);
        });
      }
    });
  }

  private registerDeployIfAction() {
    this.embark.registerActionForEvent("deploy:contract:shouldDeploy", async (params: any, cb: any) => {
      const cmd = params.contract.deployIf;
      const contract = params.contract;
      if (!cmd) {
        return cb(params);
      }

      if (typeof cmd === "function") {
        try {
          const dependencies = await this.getOnDeployLifecycleHookDependencies(contract);
          params.shouldDeploy = await contract.deployIf(dependencies);
          cb(params);
        } catch (err) {
          return cb(new Error(`Error when registering deployIf hook for ${contract.name}: ${err.message}`));
        }
      } else {

        this.events.request("runcode:eval", cmd, (err: any, result: any) => {
          if (err) {
            this.logger.error(params.contract.className + " deployIf directive has an error; contract will not deploy");
            this.logger.error(err.message || err);
            params.shouldDeploy = false;
          } else if (!result) {
            this.logger.info(params.contract.className + " deployIf directive returned false; contract will not deploy");
            params.shouldDeploy = false;
          }

          cb(params);
        });
      }
    });
  }

  private getOnDeployLifecycleHookDependencies(contractConfig: any) {
    let dependencyNames: any = contractConfig.deps || [];
    dependencyNames.push(contractConfig.className);
    // @ts-ignore
    dependencyNames = [...new Set(dependencyNames)];

    return new Promise((resolve: any, reject: any) => {
      async.map(dependencyNames, (contractName: any, next: any) => {
        this.events.request("contracts:contract", contractName, (contractRecipe: any) => {
          if (!contractRecipe) {
            return next(new Error(`ReferredContractDoesNotExist: ${contractName}`));
          }
          this.events.request("blockchain:contract:create", {
            abi: contractRecipe.abiDefinition,
            address: contractRecipe.deployedAddress,
          }, (contractInstance: any) => {
            next(null, { className: contractRecipe.className, instance: contractInstance });
          });
        });
      }, (err: any, contractInstances: any) => {
        if (err) {
          return reject(err);
        }
        this.events.request("blockchain:get", (web3: any) => resolve(this.assembleLifecycleHookDependencies(contractInstances, web3)));
      });
    });
  }

  private getAfterDeployLifecycleHookDependencies() {
    return new Promise((resolve: any, reject: any) => {
      this.events.request("contracts:list", (_err: any, contracts: any) => {
        async.map(contracts, (contract: any, next: any) => {
          this.events.request("blockchain:contract:create", {
            abi: contract.abiDefinition,
            address: contract.deployedAddress,
          }, (contractInstance: any) => {
            next(null, { className: contract.className, instance: contractInstance });
          });
        }, (err: any, contractInstances: any) => {
          if (err) {
            return reject(err);
          }
          this.events.request("blockchain:get", (web3: any) => resolve(this.assembleLifecycleHookDependencies(contractInstances, web3)));
        });
      });
    });
  }

  private assembleLifecycleHookDependencies(contractInstances: any, web3: any) {
    return contractInstances.reduce((dependencies: any, contractInstance: any) => {
      dependencies.contracts[contractInstance.className] = contractInstance.instance;
      return dependencies;
    }, { contracts: {}, web3 });
  }
}

module.exports = SpecialConfigs;
