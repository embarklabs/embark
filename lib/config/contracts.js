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
    compiled_contracts = this.compiler.compile(source);
    for (className in compiled_contracts) {
      var contract = compiled_contracts[className];
      this.all_contracts.push(className);
      this.contractDB[className] = contract;
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

