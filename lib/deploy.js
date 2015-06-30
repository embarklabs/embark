var web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var Config = require('./config/config.js');

deployContracts = function(env, contractFiles, destFile) {
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  blockchainConfig = (new Config.Blockchain()).loadConfigFile('config/blockchain.yml').config(env);

  contractsManager = (new Config.Contracts(contractFiles,  blockchainConfig)).loadConfigFile('config/contracts.yml');
  contractsConfig = contractsManager.config(env);

  try {
    web3.setProvider(new web3.providers.HttpProvider("http://" + blockchainConfig.rpcHost + ":" + blockchainConfig.rpcPort));
    primaryAddress = web3.eth.coinbase;
    web3.eth.defaultAccount = primaryAddress;
  } catch (_error) {
    e = _error;
    console.log("==== can't connect to " + blockchainConfig.rpcHost + ":" + blockchainConfig.rpcPort + " check if an ethereum node is running");
    exit;
  }

  console.log("address is : " + primaryAddress);

  result = "web3.setProvider(new web3.providers.HttpProvider('http://" + blockchainConfig.rpcHost + ":" + blockchainConfig.rpcPort + "'));";

  result += "web3.eth.defaultAccount = web3.eth.accounts[0];";

  contractDependencies = {};

  if (contractsConfig != null) {
    for (className in contractsConfig) {
      options = contractsConfig[className];
      if (options.args == null) {
        continue;
      }
      ref = options.args;
      for (i = 0, len = ref.length; i < len; i++) {
        arg = ref[i];
        if (arg[0] === "$") {
          if (contractDependencies[className] === void 0) {
            contractDependencies[className] = [];
          }
          contractDependencies[className].push(arg.substr(1));
        }
      }
    }
  }

  contractsManager.compileContracts();
  all_contracts = contractsManager.all_contracts;
  contractDB = contractsManager.contractDB;

  all_contracts.sort((function(_this) {
    return function(a, b) {
      var contract_1, contract_2;
      contract_1 = contractDependencies[a];
      contract_2 = contractDependencies[b];
      if (indexOf.call(contract_1, a) >= 0 && indexOf.call(contract_2, b) >= 0) {
        console.log("looks like you have a circular dependency between " + a + " and " + b);
        return exit;
      } else if (indexOf.call(contract_1, b) >= 0) {
        return 1;
      } else if (indexOf.call(contract_2, a) >= 0) {
        return -1;
      } else {
        return 0;
      }
    };
  })(this));

  deployedContracts = {};

  for (k = 0, len2 = all_contracts.length; k < len2; k++) {
    className = all_contracts[k];
    contract = contractDB[className];
    contractGasLimit = (contractsConfig != null ? (ref1 = contractsConfig[className]) != null ? ref1.gasLimit : void 0 : void 0) || blockchainConfig.gasLimit;
    contractGasPrice = (contractsConfig != null ? (ref2 = contractsConfig[className]) != null ? ref2.gasPrice : void 0 : void 0) || blockchainConfig.gasPrice;
    args = (contractsConfig != null ? (ref3 = contractsConfig[className]) != null ? ref3.args : void 0 : void 0) || [];
    contractObject = web3.eth.contract(contract.info.abiDefinition);
    realArgs = [];
    for (l = 0, len3 = args.length; l < len3; l++) {
      arg = args[l];
      if (arg[0] === "$") {
        realArgs.push(deployedContracts[arg.substr(1)]);
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
    deployedContracts[className] = contractAddress;
    console.log("address is " + contractAddress);
    console.log("deployed " + className + " at " + contractAddress);
    abi = JSON.stringify(contract.info.abiDefinition);
    result += "var " + className + "Abi = " + abi + ";";
    result += "var " + className + "Contract = web3.eth.contract(" + className + "Abi);";
    result += "var " + className + " = " + className + "Contract.at('" + contractAddress + "');";
  }

  grunt.file.write(destFile, result);
}

Deploy = {
  deployContracts: deployContracts
}

module.exports = Deploy

