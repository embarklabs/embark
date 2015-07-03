var web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var Config = require('./config/config.js');

Deploy = function(env, contractFiles, blockchainConfig, contractsConfig) {
  //this.blockchainConfig = (new Config.Blockchain()).loadConfigFile('config/blockchain.yml').config(env);
  this.blockchainConfig = blockchainConfig;

  //this.contractsManager = (new Config.Contracts(contractFiles,  blockchainConfig)).loadConfigFile('config/contracts.yml');
  this.contractsManager = contractsConfig;
  this.contractsConfig = this.contractsManager.config(env);
  this.deployedContracts = {};

  try {
    web3.setProvider(new web3.providers.HttpProvider("http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort));
    primaryAddress = web3.eth.coinbase;
    web3.eth.defaultAccount = primaryAddress;
  } catch (_error) {
    e = _error;
    console.log("==== can't connect to " + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + " check if an ethereum node is running");
    exit;
  }

  console.log("address is : " + primaryAddress);
}

Deploy.prototype.deploy_contracts = function(env) {
  this.contractsManager.compileContracts(env);
  all_contracts = this.contractsManager.all_contracts;
  this.contractDB = this.contractsManager.contractDB;
  contractDependencies = this.contractsManager.contractDependencies;

  this.deployedContracts = {};

  for (k = 0; k < all_contracts.length; k++) {
    className = all_contracts[k];
    contract = this.contractDB[className];

    contractGasLimit = (this.contractsConfig != null ? (ref1 = this.contractsConfig[className]) != null ? ref1.gasLimit : void 0 : void 0) || this.blockchainConfig.gasLimit;
    contractGasPrice = (this.contractsConfig != null ? (ref2 = this.contractsConfig[className]) != null ? ref2.gasPrice : void 0 : void 0) || this.blockchainConfig.gasPrice;

    args = (this.contractsConfig != null ? (ref3 = this.contractsConfig[className]) != null ? ref3.args : void 0 : void 0) || [];

    contractObject = web3.eth.contract(contract.info.abiDefinition);

    realArgs = [];
    for (l = 0, len3 = args.length; l < len3; l++) {
      arg = args[l];
      if (arg[0] === "$") {
        realArgs.push(this.deployedContracts[arg.substr(1)]);
      } else {
        realArgs.push(arg);
      }
    }

    contractParams = realArgs;
    contractParams.push({
      from: primaryAddress,
      data: contract.code,
      gas: contractGasLimit,
      gasPrice: contractGasPrice
    });

    contractAddress = contractObject["new"].apply(contractObject, contractParams).address;
    this.deployedContracts[className] = contractAddress;

    console.log("address is " + contractAddress);
    console.log("deployed " + className + " at " + contractAddress);
  }

}

Deploy.prototype.generate_abi_file = function() {
  var result;

  result = "web3.setProvider(new web3.providers.HttpProvider('http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + "'));";
  result += "web3.eth.defaultAccount = web3.eth.accounts[0];";

  for(className in this.deployedContracts) {
    var deployedContract = this.deployedContracts[className];
    var contract = this.contractDB[className];

    var abi = JSON.stringify(contract.info.abiDefinition);
    var contractAddress = deployedContract;
    result += "var " + className + "Abi = " + abi + ";";
    result += "var " + className + "Contract = web3.eth.contract(" + className + "Abi);";
    result += "var " + className + " = " + className + "Contract.at('" + contractAddress + "');";
  }

  return result;
}

Deploy.prototype.generate_and_write_abi_file = function(destFile) {
  var result = this.generate_abi_file();
  grunt.file.write(destFile, result);
}

module.exports = Deploy

