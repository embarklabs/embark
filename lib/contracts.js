var fs = require('fs');
var grunt = require('grunt');
var Compiler = require('./compiler.js');

var ContractsManager = function(configDir, contractFiles, env) {
  this.contractFiles = grunt.file.expand(contractFiles);
  this.configDir = configDir;
  this.env = env;
  this.contracts = {};
};

ContractsManager.prototype.init = function() {
  this.contractsConfig   = this.loadConfigFiles();
  this.compiledContracts = this.compileContracts();
};

ContractsManager.prototype.loadConfigFiles = function() {
  var defaultContractsConfig = JSON.parse(fs.readFileSync(this.configDir + "contracts.json"))['default'];
  //var envContractsConfig = JSON.parse(fs.readFileSync(this.configDir + this.env + "/contracts.json"))[this.env];

  //merge.recursive(defaultContractsConfig, envContractsConfig);
   return defaultContractsConfig;
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

