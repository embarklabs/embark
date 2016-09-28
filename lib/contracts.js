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

ContractsManager.prototype.init = function() {
  this.compiledContracts = this.compileContracts();
};

ContractsManager.prototype.compileContracts = function() {
  var compiler = new Compiler();
  return compiler.compile_solidity(this.contractFiles);
};

ContractsManager.prototype.build = function() {

  // =======================
  // =======================
  // TODO: this should be going through the contract config, not just the
  // compiled list
  // =======================
  // =======================

  for(var className in this.compiledContracts) {
    var contract = this.compiledContracts[className];
    var contractConfig = this.contractsConfig.contracts[className];

    if (this.contractsConfig.gas === 'auto') {
      var maxGas = Math.max(contract.gasEstimates.creation[0], contract.gasEstimates.creation[1], 500000);
      var adjustedGas = Math.round(maxGas * 1.01);
      contract.gas = adjustedGas;
    } else {
      contract.gas = this.contractsConfig.gas;
    }
    contract.gasPrice = this.contractsConfig.gasPrice;

    if (contractConfig === undefined) {
      contract.args = [];
    } else {
      contract.args = contractConfig.args || [];
    }

    contract.type = 'file';

    contract.className = className;
    contract.address = contractConfig.address;

    this.contracts[className] = contract;
  }

  for(var className in this.contractsConfig.contracts) {
    var contractConfig = this.contractsConfig.contracts[className];
    var contract;

    if (contractConfig.instanceOf !== undefined) {
      // TODO: should merge with parent object
      var parentContractName = contractConfig.instanceOf;
      var parentContract = this.contractsConfig.contracts[parentContractName];
      var parentContractObject = this.contracts[parentContractName];
      contract = JSON.parse(JSON.stringify(parentContractObject));
      contract.deploy = true;
      contract.className = className;
      contract.args = (contractConfig.args || parentContract.args);
      contract.gas  = (contractConfig.gas || parentContract.gas);
      contract.gasPrice  = (contractConfig.gasPrice || parentContract.gasPrice);

      this.contracts[className] = contract;
    }
  }

  // determine dependencies
  for (var className in this.compiledContracts) {
    var contract = this.compiledContracts[className];
    var contractConfig = this.contractsConfig.contracts[className];

    if (this.contractsConfig.args === null || this.contractsConfig.args === []) continue;

    var ref = contractConfig.args; //get arguments
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

    data.push([
      className.green,
      (contract.deployedAddress || '...').green,
      ((contract.deployedAddress !== undefined) ? "\t\tDeployed".green : "\t\tPending".magenta)
    ]);
  }

  return data;
};

module.exports = ContractsManager;

