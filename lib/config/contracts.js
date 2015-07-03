indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
var readYaml = require('read-yaml');
var fs = require('fs');
var Blockchain = require('./blockchain.js');
var toposort = require('toposort');

ContractsConfig = function(blockchainConfig, web3) {
  this.blockchainConfig = blockchainConfig;
  this.web3 = web3;
  this.contractFiles = [];
}

ContractsConfig.prototype.init = function(files) {
  this.all_contracts = [];
  this.contractDB = {};
  this.contractFiles = files;
  this.contractDependencies = {};

  try {
    this.web3.setProvider(new this.web3.providers.HttpProvider("http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort));
    primaryAddress = this.web3.eth.coinbase;
    this.web3.eth.defaultAccount = primaryAddress;
  } catch (_error) {
    e = _error;
    throw new Error("can't connect to " + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + " check if an ethereum node is running");
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

ContractsConfig.prototype.compileContracts = function(env) {
  var contractFile, source, j;
  var contractsConfig = this.config(env);

  if (contractsConfig != null) {
    for (className in contractsConfig) {
      options = contractsConfig[className];
      if (options.args == null) continue;

      ref = options.args;
      for (j = 0; j < ref.length; j++) {
        arg = ref[j];
        if (arg[0] === "$") {
          if (this.contractDependencies[className] === void 0) {
            this.contractDependencies[className] = [];
          }
          this.contractDependencies[className].push(arg.substr(1));
        }
      }
    }
  }

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

  this.sortContracts();
}

ContractsConfig.prototype.sortContracts = function() {
  var converted_dependencies = [], i;

  for(contract in this.contractDependencies) {
    var dependencies = this.contractDependencies[contract];
    for(i=0; i < dependencies.length; i++) {
      converted_dependencies.push([contract, dependencies[i]]);
    }
  }

  var orderedDependencies = toposort(converted_dependencies).reverse();

  this.all_contracts = this.all_contracts.sort(function(a,b) {
    var order_a = orderedDependencies.indexOf(a);
    var order_b = orderedDependencies.indexOf(b);
    return order_a - order_b;
  });;
}

module.exports = ContractsConfig

