var readYaml = require('read-yaml');
var fs = require('fs');
var toposort = require('toposort');
var web3 = require('web3');
var Pudding = require('ether-pudding');

ContractsConfig = function(blockchainConfig, compiler) {
  this.blockchainConfig = blockchainConfig;
  this.compiler = compiler;
  this.contractFiles = [];
}

ContractsConfig.prototype.init = function(files, env, _web3) {
  if (_web3 !== undefined) {
    web3 = _web3;
  }
  this.all_contracts = [];
  this.contractDB = {};
  this.contractFiles = files;
  this.contractDependencies = {};
  this.contractStubs = {};

  //TODO: have to specify environment otherwise wouldn't work with staging
  if (this.blockchainConfig.config != undefined) {
    //this.blockchainConfig = this.blockchainConfig.config('development');
    this.blockchainConfig = this.blockchainConfig.config(env);
  }
};

ContractsConfig.prototype.loadConfigFile = function(filename) {
  try {
    this.contractConfig = readYaml.sync(filename);
  } catch (e) {
    throw new Error("error reading " + filename);
  }
  return this;
};

ContractsConfig.prototype.loadConfig = function(config) {
  this.contractConfig = config;
  return this;
};

ContractsConfig.prototype.config = function(env) {
  return this.contractConfig[env];
};

ContractsConfig.prototype.compileContracts = function(env) {
  var contractFile;
  var contractsConfig = this.config(env);
  this.compiler.init(env);

  compiled_contracts = this.compiler.compile(this.contractFiles); //compile and push to contract DB

  for (var className in compiled_contracts) {

    this.all_contracts.push(className);
    this.contractDB[className] = {
      args: [],
      types: ['file'],
      gasPrice: this.blockchainConfig.gasPrice,
      gasLimit: this.blockchainConfig.gasLimit,
      compiled: compiled_contracts[className]
    }
  }

  for(className in contractsConfig) {
    var contractConfig = contractsConfig[className];

    var contract;
    contract = this.contractDB[className];
    if (contract === undefined) {
      contract = {
        args: [],
        types: ['file'],
        gasPrice: this.blockchainConfig.gasPrice,
        gasLimit: this.blockchainConfig.gasLimit,
        compiled: contract
      }
      this.contractDB[className] = contract;
    }

    contract.gasPrice = contractConfig.gas_price || contract.gasPrice;
    contract.gasLimit = contractConfig.gas_limit || contract.gasLimit;
    contract.args     = contractConfig.args      || [];
    contract.address  = contractConfig.address;
    contract.onDeploy = contractConfig.onDeploy  || [];

    if (contractConfig.instanceOf !== undefined) {
      contract.types.push('instance');
      contract.instanceOf = contractConfig.instanceOf;
      contract.compiled = compiled_contracts[contractConfig.instanceOf];
    }
    if (contractConfig.address !== undefined) {
      contract.types.push('static');
    }

    contract.deploy = contractConfig.deploy;
    if (contractConfig.deploy === undefined) {
      contract.deploy = true;
    }

    if (this.all_contracts.indexOf(className) < 0) {
      this.all_contracts.push(className);
    }
  }

};

/*ContractsConfig.prototype.sortContracts = function() {
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
};*/

module.exports = ContractsConfig;

