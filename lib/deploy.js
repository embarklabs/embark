var web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var Config = require('./config/config.js');
var sleep = require('sleep');

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
  } catch (e) {
    throw new Error("==== can't connect to " + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + " check if an ethereum node is running");
  }

  console.log("primary account address is : " + primaryAddress);
};

Deploy.prototype.deploy_contracts = function(env) {
  this.contractsManager.compileContracts(env);
  all_contracts = this.contractsManager.all_contracts;
  this.contractDB = this.contractsManager.contractDB;
  contractDependencies = this.contractsManager.contractDependencies;

  this.deployedContracts = {};

  for (k = 0; k < all_contracts.length; k++) {
    className = all_contracts[k];
    contract = this.contractDB[className];

    if (contract.address !== undefined) {
      this.deployedContracts[className] = contract.address;

      //console.log("contract " + className + " at " + contractAddress);
      console.log("contract " + className + " at " + contract.address);
    }
    else {
      contractObject = web3.eth.contract(contract.compiled.info.abiDefinition);

      realArgs = [];
      for (var l = 0; l < contract.args.length; l++) {
        arg = contract.args[l];
        if (arg[0] === "$") {
          realArgs.push(this.deployedContracts[arg.substr(1)]);
        } else {
          realArgs.push(arg);
        }
      }

      contractParams = realArgs;
      contractParams.push({
        from: primaryAddress,
        data: contract.compiled.code,
        gas: contract.gasLimit,
        gasPrice: contract.gasPrice
      });

      var transactionHash = contractObject["new"].apply(contractObject, contractParams).transactionHash;
      // TODO: get this with sync until a different mechanism is implemented
      //this.deployedContracts[className] = contractAddress;
      //console.log("address is " + contractAddress);

      console.log('trying to obtain ' + className + ' address...');
      var receipt = null;
      while ((receipt = web3.eth.getTransactionReceipt(transactionHash)) === null || receipt.contractAddress === null) {
          sleep.sleep(1);
      }
      var contractAddress = receipt.contractAddress;
      this.deployedContracts[className] = contractAddress;

      console.log("deployed " + className + " at " + contractAddress);
    }
  }

};

Deploy.prototype.generate_abi_file = function() {
  var result;

  result = "web3.setProvider(new web3.providers.HttpProvider('http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + "'));";
  result += "web3.eth.defaultAccount = web3.eth.accounts[0];";

  for(className in this.deployedContracts) {
    var deployedContract = this.deployedContracts[className];
    var contract = this.contractDB[className];

    var abi = JSON.stringify(contract.compiled.info.abiDefinition);
    var contractAddress = deployedContract;

    console.log('address is ' + contractAddress);

    result += className + "Abi = " + abi + ";";
    result += className + "Contract = web3.eth.contract(" + className + "Abi);";
    result += className + " = " + className + "Contract.at('" + contractAddress + "');";
  }

  return result;
};

Deploy.prototype.generate_and_write_abi_file = function(destFile) {
  var result = this.generate_abi_file();
  grunt.file.write(destFile, result);
};

module.exports = Deploy;

