var readYaml = require('read-yaml');
var fs = require('fs');
var toposort = require('toposort');

ContractsConfig = function(blockchainConfig, compiler) {
  this.blockchainConfig = blockchainConfig;
  this.compiler = compiler;
  this.contractFiles = [];
}

ContractsConfig.prototype.init = function(files) {
  this.all_contracts = [];
  this.contractDB = {};
  this.contractFiles = files;
  this.contractDependencies = {};

  //TODO: have to specify environment otherwise wouldn't work with staging
  if (this.blockchainConfig.config != undefined) {
    this.blockchainConfig = this.blockchainConfig.config('development');
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
  var contractFile, source, j;
  var contractsConfig = this.config(env);
  this.compiler.init(env);

  // determine dependencies
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

  var all_compiled_contracts = {};
  // compile files
  for (j = 0; j < this.contractFiles.length; j++) {
    contractFile = this.contractFiles[j];
    source = fs.readFileSync(contractFile).toString()

    console.log("compiling " + contractFile);
    compiled_contracts = this.compiler.compile(source);
    for (className in compiled_contracts) {
      var contract = compiled_contracts[className];
      all_compiled_contracts[className] = contract;
      this.all_contracts.push(className);
      this.contractDB[className] = {
        args: [],
        types: ['file'],
        gasPrice: this.blockchainConfig.gas_price,
        gasLimit: this.blockchainConfig.gas_limit,
        compiled: contract
      }
    }
  }

  // TODO: move this
  // determine full contract list

  // will be a combination between compiled contracts and the ones in config

  for(className in contractsConfig) {
    var contractConfig = contractsConfig[className];

    var contract;
    contract = this.contractDB[className];
    if (contract === undefined) {
      contract = {};
      this.contractDB[className] = contract;
    }

    contract.gasPrice = contract.gasPrice || contractConfig.gas_price;
    contract.gasLimit = contract.gasLimit || contractConfig.gas_limit;
    contract.args     = contractConfig.args;

    if (contractConfig.instanceOf === undefined) {
      contract.types.push('instance');
      contract.instanceOf = contractConfig.instanceOf;
    }

    if (this.all_contracts.indexOf(className) < 0) {
      this.all_contracts.push(className);
    }
  }

  this.sortContracts();
};

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
};

module.exports = ContractsConfig;

