let toposort = require('toposort');
let async = require('async');

let Compiler = require('./compiler.js');
let utils = require('../utils/utils.js');
const constants = require('../constants');

// TODO: create a contract object

class ContractsManager {
  constructor(options) {
    this.contractFiles = options.contractFiles;
    this.contractsConfig = options.contractsConfig;
    this.contracts = {};
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.contractDependencies = {};
    this.gasLimit = options.gasLimit;
    this.deployOnlyOnConfig = false;
    this.events = options.events;

    this.events.on(constants.events.contractFilesChanged, (newContractFiles) => {
      this.contractFiles = newContractFiles;
    });
    this.events.on(constants.events.contractConfigChanged, (newContracts) => {
      this.contractsConfig = newContracts;
    });
  }

  build(done) {
    let self = this;
    async.waterfall([
      function compileContracts(callback) {
        let compiler = new Compiler({plugins: self.plugins, logger: self.logger});
        compiler.compile_contracts(self.contractFiles, function (err, compiledObject) {
          self.compiledContracts = compiledObject;
          callback(err);
        });
      },
      function prepareContractsFromConfig(callback) {
        let className, contract;
        for (className in self.contractsConfig.contracts) {
          contract = self.contractsConfig.contracts[className];

          contract.className = className;
          contract.args = contract.args || [];

          self.contracts[className] = contract;
        }
        callback();
      },
      function prepareContractsFromCompilation(callback) {
        let className, compiledContract, contractConfig, contract;
        for (className in self.compiledContracts) {
          compiledContract = self.compiledContracts[className];
          contractConfig = self.contractsConfig.contracts[className];

          contract = self.contracts[className] || {className: className, args: []};

          contract.code = compiledContract.code;
          contract.runtimeBytecode = compiledContract.runtimeBytecode;
          contract.realRuntimeBytecode = (contract.realRuntimeBytecode || contract.runtimeBytecode);
          contract.swarmHash = compiledContract.swarmHash;
          contract.gasEstimates = compiledContract.gasEstimates;
          contract.functionHashes = compiledContract.functionHashes;
          contract.abiDefinition = compiledContract.abiDefinition;
          contract.filename = compiledContract.filename;

          contract.gas = (contractConfig && contractConfig.gas) || self.contractsConfig.gas || 'auto';

          contract.gasPrice = contract.gasPrice || self.contractsConfig.gasPrice;
          contract.type = 'file';
          contract.className = className;

          self.contracts[className] = contract;
        }
        callback();
      },
      function setDeployIntention(callback) {
        let className, contract;
        for (className in self.contracts) {
          contract = self.contracts[className];
          contract.deploy = (contract.deploy === undefined) || contract.deploy;
          if (self.deployOnlyOnConfig && !self.contractsConfig.contracts[className]) {
            contract.deploy = false;
          }

          if (contract.code === "") {
            self.logger.info("assuming " + className + " to be an interface");
            contract.deploy = false;
          }
        }
        callback();
      },
      /*eslint complexity: ["error", 11]*/
      function dealWithSpecialConfigs(callback) {
        let className, contract, parentContractName, parentContract;
        let dictionary = Object.keys(self.contracts);

        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.instanceOf === undefined) {
            continue;
          }

          parentContractName = contract.instanceOf;
          parentContract = self.contracts[parentContractName];

          if (parentContract === className) {
            self.logger.error(className + ": instanceOf is set to itself");
            continue;
          }

          if (parentContract === undefined) {
            self.logger.error(className + ": couldn't find instanceOf contract " + parentContractName);
            let suggestion = utils.proposeAlternative(parentContractName, dictionary, [className, parentContractName]);
            if (suggestion) {
              self.logger.warn('did you mean "' + suggestion + '"?');
            }
            continue;
          }

          if (parentContract.args && parentContract.args.length > 0 && ((contract.args && contract.args.length === 0) || contract.args === undefined)) {
            contract.args = parentContract.args;
          }

          if (contract.code !== undefined) {
            self.logger.error(className + " has code associated to it but it's configured as an instanceOf " + parentContractName);
          }

          contract.code = parentContract.code;
          contract.runtimeBytecode = parentContract.runtimeBytecode;
          contract.gasEstimates = parentContract.gasEstimates;
          contract.functionHashes = parentContract.functionHashes;
          contract.abiDefinition = parentContract.abiDefinition;

          contract.gas = contract.gas || parentContract.gas;
          contract.gasPrice = contract.gasPrice || parentContract.gasPrice;
          contract.type = 'instance';

        }
        callback();
      },
      function removeContractsWithNoCode(callback) {
        let className, contract;
        let dictionary = Object.keys(self.contracts);
        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.code === undefined) {
            self.logger.error(className + " has no code associated");
            let suggestion = utils.proposeAlternative(className, dictionary, [className]);
            if (suggestion) {
              self.logger.warn('did you mean "' + suggestion + '"?');
            }
            delete self.contracts[className];
          }
        }
        self.logger.trace(self.contracts);
        callback();
      },
      // TODO: needs refactoring, has gotten too complex
      /*eslint complexity: ["error", 16]*/
      /*eslint max-depth: ["error", 16]*/
      function determineDependencies(callback) {
        let className, contract;
        for (className in self.contracts) {
          contract = self.contracts[className];

          // look in code for dependencies
          let libMatches = (contract.code.match(/\:(.*?)(?=_)/g) || []);
          for (let match of libMatches) {
              self.contractDependencies[className] = self.contractDependencies[className] || [];
              self.contractDependencies[className].push(match.substr(1));
          }

          // look in arguments for dependencies
          if (contract.args === []) continue;

          let ref;
          if (Array.isArray(contract.args)) {
            ref = contract.args;
          } else {
            let keys = Object.keys(contract.args);
            ref = keys.map((k) => contract.args[k]).filter((x) => !x);
          }

          for (let j = 0; j < ref.length; j++) {
            let arg = ref[j];
            if (arg[0] === "$") {
              self.contractDependencies[className] = self.contractDependencies[className] || [];
              self.contractDependencies[className].push(arg.substr(1));
            }
            if (Array.isArray(arg)) {
              for (let sub_arg of arg) {
                if (sub_arg[0] === "$") {
                  self.contractDependencies[className] = self.contractDependencies[className] || [];
                  self.contractDependencies[className].push(sub_arg.substr(1));
                }
              }
            }
          }

          // look in onDeploy for dependencies
          if (contract.onDeploy === [] || contract.onDeploy === undefined) continue;
          let regex = /\$\w+/g;
          contract.onDeploy.map((cmd) => {
            cmd.replace(regex, (match) => {
              self.contractDependencies[className] = self.contractDependencies[className] || [];
              self.contractDependencies[className].push(match.substr(1));
            });
          });
        }
        callback();
      }
    ], function (err, _result) {
      if (err) {
        self.logger.error("Error Compiling/Building contracts: " + err);
      }
      self.logger.trace("finished".underline);
      done(err, self);
    });
  }

  getContract(className) {
    return this.contracts[className];
  }

  sortContracts(contractList) {
    let converted_dependencies = [], i;

    for (let contract in this.contractDependencies) {
      let dependencies = this.contractDependencies[contract];
      for (i = 0; i < dependencies.length; i++) {
        converted_dependencies.push([contract, dependencies[i]]);
      }
    }

    let orderedDependencies;

    try {
      orderedDependencies =  toposort(converted_dependencies.filter((x) => x[0] != x[1])).reverse();
    } catch(e) {
      this.logger.error(("Error: " + e.message).red);
      this.logger.error("there are two or more contracts that depend on each other in a cyclic manner".bold.red);
      this.logger.error("Embark couldn't determine which one to deploy first".red);
      throw new Error("CyclicDependencyError");
      //process.exit(0);
    }

    let newList = contractList.sort(function (a, b) {
      let order_a = orderedDependencies.indexOf(a.className);
      let order_b = orderedDependencies.indexOf(b.className);
      return order_a - order_b;
    });

    return newList;
  }

  // TODO: should be built contracts
  listContracts() {
    let contracts = [];
    for (let className in this.contracts) {
      let contract = this.contracts[className];
      contracts.push(contract);
    }
    return this.sortContracts(contracts);
  }

  contractsState() {
    let data = [];

    for (let className in this.contracts) {
      let contract = this.contracts[className];

      let contractData;

      if (contract.deploy === false) {
        contractData = [
          className.green,
          'Interface or set to not deploy'.green,
          "\t\tn/a".green
        ];
      } else if (contract.error) {
        contractData = [
          className.green,
          (contract.error).split("\n")[0].replace(/Error: /g, '').substring(0, 32).red,
          '\t\tError'.red
        ];
      } else {
        contractData = [
          className.green,
          (contract.deployedAddress || '...').green,
          ((contract.deployedAddress !== undefined) ? "\t\tDeployed".green : "\t\tPending".magenta)
        ];
      }

      data.push(contractData);
    }

    return data;
  }
}

module.exports = ContractsManager;
