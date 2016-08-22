var Compiler = require('./compiler.js');

var ContractsManager = function(options) {
  this.contractFiles = options.contractFiles;
  this.contractsConfig = options.contractsConfig;
  this.contracts = {};
};

ContractsManager.prototype.init = function() {
  this.compiledContracts = this.compileContracts();
};

ContractsManager.prototype.compileContracts = function() {
  var compiler = new Compiler();
  return compiler.compile_solidity(this.contractFiles);
};

ContractsManager.prototype.build = function() {
  for(var className in this.compiledContracts) {
    var contract = this.compiledContracts[className];
    var contractConfig = this.contractsConfig[className];

    contract.gasLimit = this.contractsConfig.gasLimit;
    contract.gasPrice = this.contractsConfig.gasPrice;

    if (contractConfig === undefined) {
      contract.args = [];
    } else {
      contract.args = contractConfig.args || [];
    }

    contract.className = className;
    this.contracts[className] = contract;
  }
};

ContractsManager.prototype.listContracts = function() {
  var contracts = [];
  for(var className in this.compiledContracts) {
    var contract = this.compiledContracts[className];
    contracts.push(contract);
  }
  return contracts;
};

module.exports = ContractsManager;

