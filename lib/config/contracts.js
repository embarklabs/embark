var readYaml = require('read-yaml');
var fs = require('fs');
var Blockchain = require('./blockchain.js');

ContractsConfig = function(files, blockchainConfig, web3) {
  this.all_contracts = [];
  this.contractDB = {};
  this.contractFiles = files;
  this.web3 = web3;

  try {
    this.web3.setProvider(new this.web3.providers.HttpProvider("http://" + blockchainConfig.rpcHost + ":" + blockchainConfig.rpcPort));
    primaryAddress = this.web3.eth.coinbase;
    this.web3.eth.defaultAccount = primaryAddress;
  } catch (_error) {
    e = _error;
    throw new Error("can't connect to " + blockchainConfig.rpcHost + ":" + blockchainConfig.rpcPort + " check if an ethereum node is running");
  }

  console.log("address is : " + primaryAddress);
};

ContractsConfig.prototype.loadConfigFile = function(filename) {
  try {
    this.contractConfig = readYaml.sync(filename);
  } catch (e) {
    throw new Error("error reading " + filename);
  }
  return this;
}

ContractsConfig.prototype.loadConfig = function(config) {
  this.contractConfig = config;
  return this;
}

ContractsConfig.prototype.config = function(env) {
  return this.contractConfig[env];
}

ContractsConfig.prototype.compileContracts = function() {
  var contractFile, source, j;

  for (j = 0; j < this.contractFiles.length; j++) {
    contractFile = this.contractFiles[j];
    source = fs.readFileSync(contractFile).toString()

    console.log("compiling " + contractFile);
    compiled_contracts = this.web3.eth.compile.solidity(source);
    for (className in compiled_contracts) {
      var contract = compiled_contracts[className];
      this.all_contracts.push(className);
      this.contractDB[className] = contract;
    }
  }
}

module.exports = ContractsConfig

