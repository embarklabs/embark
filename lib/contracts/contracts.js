let toposort = require('toposort');
let async = require('async');

let Compiler = require('./compiler.js');

// TODO: create a contract object

class ContractsManager {
  constructor(options) {
    this.contractFiles = options.contractFiles;
    this.contractsConfig = options.contractsConfig;
    this.contracts = {};
    this.logger = options.logger;
    this.plugins = options.plugins;

    this.contractDependencies = {};
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
      function setDeployIntention(callback) {
        let className, contract;
        for (className in self.contracts) {
          contract = self.contracts[className];
          contract.deploy = (contract.deploy === undefined) || contract.deploy;
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
          self.adjustGas(contract);

          contract.gasPrice = contract.gasPrice || self.contractsConfig.gasPrice;
          contract.type = 'file';
          contract.className = className;

          self.contracts[className] = contract;
        }
        callback();
      },
      /*eslint complexity: ["error", 11]*/
      function dealWithSpecialConfigs(callback) {
        let className, contract, parentContractName, parentContract;

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
        for (className in self.contracts) {
          contract = self.contracts[className];

          if (contract.code === undefined) {
            self.logger.error(className + " has no code associated");
            delete self.contracts[className];
          }
        }
        self.logger.trace(self.contracts);
        callback();
      },
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
          let ref = contract.args;
          for (let j = 0; j < ref.length; j++) {
            let arg = ref[j];
            if (arg[0] === "$") {
              self.contractDependencies[className] = self.contractDependencies[className] || [];
              self.contractDependencies[className].push(arg.substr(1));
            }
          }
        }
        callback();
      }
    ], function (err, result) {
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

    let orderedDependencies = toposort(converted_dependencies).reverse();

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
          (contract.error).red,
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

  adjustGas(contract) {
    let maxGas, adjustedGas;
    if (contract.gas === 'auto') {
      if (contract.deploy || contract.deploy === undefined) {
        if (contract.gasEstimates.creation !== undefined) {
          // TODO: should sum it instead
          maxGas = Math.max(contract.gasEstimates.creation[0], contract.gasEstimates.creation[1], 500000);
        } else {
          maxGas = 500000;
        }
      } else {
        maxGas = 500000;
      }
      // TODO: put a check so it doesn't go over the block limit
      adjustedGas = Math.round(maxGas * 1.40);
      adjustedGas += 25000;
      contract.gas = adjustedGas;
    }
  }
}

module.exports = ContractsManager;
