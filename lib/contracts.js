var Compiler = require('./compiler.js');

var ContractsManager = function(options) {
  this.contractFiles = options.contractFiles;
  this.contractsConfig = options.contractsConfig;
  this.contracts = {};
  this.logger = options.logger;
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

    contract.className = className;
    this.contracts[className] = contract;
  }
};

// TODO: should be built contracts
ContractsManager.prototype.listContracts = function() {
  var contracts = [];
  for(var className in this.compiledContracts) {
    var contract = this.compiledContracts[className];
    contracts.push(contract);
  }
  return contracts;
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

