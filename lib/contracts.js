var Compiler = require('./compiler.js');
var toposort = require('toposort');

// TODO: create a contract object

var ContractsManager = function(options) {
  this.contractFiles = options.contractFiles;
  this.contractsConfig = options.contractsConfig;
  this.contracts = {};
  this.logger = options.logger;

  this.contractDependencies = {};
};

ContractsManager.prototype.compileContracts = function() {
  var compiler = new Compiler();
  return compiler.compile_solidity(this.contractFiles);
};

ContractsManager.prototype.build = function() {
  this.compiledContracts = this.compileContracts();

  // go through config file first
  for(var className in this.contractsConfig.contracts) {
    var contract = this.contractsConfig.contracts[className];

    contract.className = className;
    contract.args = contract.args || [];

    this.contracts[className] = contract;
  }

  // compile contracts
  for(var className in this.compiledContracts) {
    var compiledContract = this.compiledContracts[className];
    var contractConfig   = this.contractsConfig.contracts[className];

    var contract = this.contracts[className] || {className: className, args: []};

    contract.code             = compiledContract.code;
    contract.runtimeBytecode  = compiledContract.runtimeBytecode;
    contract.gasEstimates     = compiledContract.gasEstimates;
    contract.functionHashes   = compiledContract.functionHashes;
    contract.abiDefinition    = compiledContract.abiDefinition;

    if (this.contractsConfig.gas === 'auto') {
      var maxGas;
      if (contract.deploy) {
        maxGas = Math.max(contract.gasEstimates.creation[0], contract.gasEstimates.creation[1], 500000);
      } else {
        maxGas = 500000;
      }
      var adjustedGas = Math.round(maxGas * 1.01);
      contract.gas = adjustedGas;
    } else {
      contract.gas = this.contractsConfig.gas;
    }
    contract.gasPrice = this.contractsConfig.gasPrice;
    contract.type = 'file';
    contract.className = className;

    this.contracts[className] = contract;
  }

  // deal with special configs
  for(var className in this.contracts) {
    var contract = this.contracts[className];

    // if deploy intention is not specified default is true
    if (contract.deploy === undefined) {
      contract.deploy = true;
    }

    if (contract.instanceOf !== undefined) {
      var parentContractName = contract.instanceOf;
      var parentContract = this.contracts[parentContractName];

      if (parentContract === className) {
        this.logger.error(className + ": instanceOf is set to itself");
        continue;
      }

      if (parentContract === undefined) {
        this.logger.error(className + ": couldn't find instanceOf contract " + parentContractName);
        continue;
      }

      if (parentContract.args && parentContract.args.length > 0 && contract.args === []) {
        contract.args = parentContract.args;
      }

      if (contract.code !== undefined) {
        this.logger.error(className + " has code associated to it but it's configured as an instanceOf " + parentContractName);
      }

      contract.code             = parentContract.code;
      contract.runtimeBytecode  = parentContract.runtimeBytecode;
      contract.gasEstimates     = parentContract.gasEstimates;
      contract.functionHashes   = parentContract.functionHashes;
      contract.abiDefinition    = parentContract.abiDefinition;

      contract.gas       = contract.gas      || parentContract.gas;
      contract.gasPrice  = contract.gasPrice || parentContract.gasPrice;
    }
  }

  // remove contracts that don't have code
  for(var className in this.contracts) {
    var contract = this.contracts[className];

    if (contract.code === undefined) {
        this.logger.error(className + " has no code associated");
        delete this.contracts[className];
    }
  }

  this.logger.trace(this.contracts);

  // determine dependencies
  for(var className in this.contracts) {
    var contract = this.contracts[className];

    if (contract.args === []) continue;

    var ref = contract.args;
    for (var j = 0; j < ref.length; j++) {
      var arg = ref[j];
      if (arg[0] === "$") {
        if (this.contractDependencies[className] === void 0) {
          this.contractDependencies[className] = [];
        }
        this.contractDependencies[className].push(arg.substr(1));
      }
    }
  }

};

ContractsManager.prototype.getContract = function(className) {
  return this.compiledContracts[className];
};

ContractsManager.prototype.sortContracts = function(contractList) {
  var converted_dependencies = [], i;

  for(var contract in this.contractDependencies) {
    var dependencies = this.contractDependencies[contract];
    for(var i=0; i < dependencies.length; i++) {
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
        "n/a".green
      ]
    } else {
      contractData = [
        className.green,
        (contract.deployedAddress || '...').green,
        ((contract.deployedAddress !== undefined) ? "\t\tDeployed".green : "\t\tPending".magenta)
      ]
    }

    data.push(contractData);
  }

  return data;
};

module.exports = ContractsManager;

