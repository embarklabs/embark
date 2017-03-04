var toposort = require('toposort');
var async = require('async');

var Compiler = require('./compiler.js');

// TODO: create a contract object

var adjustGas = function(contract) {
  var maxGas, adjustedGas;
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
    adjustedGas  = Math.round(maxGas * 1.40);
    adjustedGas += 25000;
    contract.gas = adjustedGas;
  }
};

var ContractsManager = function(options) {
  this.contractFiles = options.contractFiles;
  this.contractsConfig = options.contractsConfig;
  this.contracts = {};
  this.logger = options.logger;
  this.plugins = options.plugins;

  this.contractDependencies = {};
};

ContractsManager.prototype.build = function(done) {
  var self = this;
  async.waterfall([
    function compileContracts(callback) {
      var compiler = new Compiler({plugins: self.plugins, logger: self.logger});
        compiler.compile_contracts(self.contractFiles, function(err, compiledObject) {
          self.compiledContracts = compiledObject;
          callback(err);
        });
    },
    function prepareContractsFromConfig(callback) {
      var className, contract;
      for(className in self.contractsConfig.contracts) {
        contract = self.contractsConfig.contracts[className];

        contract.className = className;
        contract.args = contract.args || [];

        self.contracts[className] = contract;
      }
      callback();
    },
    function setDeployIntention(callback) {
      var className, contract;
      for(className in self.contracts) {
        contract = self.contracts[className];
        contract.deploy = (contract.deploy === undefined) || contract.deploy;
      }
      callback();
    },
    function prepareContractsFromCompilation(callback) {
      var className, compiledContract, contractConfig, contract;
      for(className in self.compiledContracts) {
        compiledContract = self.compiledContracts[className];
        contractConfig   = self.contractsConfig.contracts[className];

        contract = self.contracts[className] || {className: className, args: []};

        contract.code             = compiledContract.code;
        contract.runtimeBytecode  = compiledContract.runtimeBytecode;
        contract.realRuntimeBytecode = (contract.realRuntimeBytecode || contract.runtimeBytecode);
        contract.swarmHash        = compiledContract.swarmHash;
        contract.gasEstimates     = compiledContract.gasEstimates;
        contract.functionHashes   = compiledContract.functionHashes;
        contract.abiDefinition    = compiledContract.abiDefinition;

        contract.gas = (contractConfig && contractConfig.gas) || self.contractsConfig.gas || 'auto';
        adjustGas(contract);

        contract.gasPrice = contract.gasPrice || self.contractsConfig.gasPrice;
        contract.type = 'file';
        contract.className = className;

        self.contracts[className] = contract;
      }
      callback();
    },
    /*eslint complexity: ["error", 11]*/
    function dealWithSpecialConfigs(callback) {
      var className, contract, parentContractName, parentContract;

      for(className in self.contracts) {
        contract = self.contracts[className];

        if (contract.instanceOf === undefined) { continue; }

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

        contract.code             = parentContract.code;
        contract.runtimeBytecode  = parentContract.runtimeBytecode;
        contract.gasEstimates     = parentContract.gasEstimates;
        contract.functionHashes   = parentContract.functionHashes;
        contract.abiDefinition    = parentContract.abiDefinition;

        contract.gas       = contract.gas      || parentContract.gas;
        contract.gasPrice  = contract.gasPrice || parentContract.gasPrice;
        contract.type = 'instance';

      }
      callback();
    },
    function removeContractsWithNoCode(callback) {
      var className, contract;
      for(className in self.contracts) {
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
      var className, contract;
      for(className in self.contracts) {
        contract = self.contracts[className];

        if (contract.args === []) continue;

        var ref = contract.args;
        for (var j = 0; j < ref.length; j++) {
          var arg = ref[j];
          if (arg[0] === "$") {
            self.contractDependencies[className] = self.contractDependencies[className] || [];
            self.contractDependencies[className].push(arg.substr(1));
          }
        }
      }
      callback();
    }
  ], function(err, result) {
    if (err) {
      self.logger.error("Error Compiling/Building contracts: " + err);
    }
    self.logger.trace("finished".underline);
    done(err, self);
  });
};

ContractsManager.prototype.getContract = function(className) {
  return this.contracts[className];
};

ContractsManager.prototype.sortContracts = function(contractList) {
  var converted_dependencies = [], i;

  for(var contract in this.contractDependencies) {
    var dependencies = this.contractDependencies[contract];
    for(i=0; i < dependencies.length; i++) {
      converted_dependencies.push([contract, dependencies[i]]);
    }
  }

  var orderedDependencies = toposort(converted_dependencies).reverse();

  var newList = contractList.sort(function(a,b) {
    var order_a = orderedDependencies.indexOf(a.className);
    var order_b = orderedDependencies.indexOf(b.className);
    return order_a - order_b;
  });

  return newList;
};

// TODO: should be built contracts
ContractsManager.prototype.listContracts = function() {
  var contracts = [];
  for(var className in this.contracts) {
    var contract = this.contracts[className];
    contracts.push(contract);
  }
  return this.sortContracts(contracts);
};

ContractsManager.prototype.contractsState = function() {
  var data = [];

  for(var className in this.contracts) {
    var contract = this.contracts[className];

    var contractData;

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
};

module.exports = ContractsManager;
