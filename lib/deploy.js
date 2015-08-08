var web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var Config = require('./config/config.js');

// Ugly, but sleep lib has issues on osx
sleep = function sleep(ms) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + ms);
}

Deploy = function(env, contractFiles, blockchainConfig, contractsConfig, chainManager) {
  //this.blockchainConfig = (new Config.Blockchain()).loadConfigFile('config/blockchain.yml').config(env);
  this.blockchainConfig = blockchainConfig;
  this.chainManager = chainManager;
  this.chainManager.init(env, this.blockchainConfig);

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

Deploy.prototype.deploy_contract = function(contractObject, contractParams) {
  var transactionHash = contractObject["new"].apply(contractObject, contractParams).transactionHash;
  var receipt = null;
  var time = 0;
  while ((receipt = web3.eth.getTransactionReceipt(transactionHash)) === null || receipt.contractAddress === null) {
    sleep(1000);
    time += 1;
    if (time >= 20) {
      return false;
    }
  }
  return receipt;
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

    var realArgs = [];
    for (var l = 0; l < contract.args.length; l++) {
      arg = contract.args[l];
      if (arg[0] === "$") {
        realArgs.push(this.deployedContracts[arg.substr(1)]);
      } else {
        realArgs.push(arg);
      }
    }

    if (contract.address !== undefined) {
      this.deployedContracts[className] = contract.address;

      //console.log("contract " + className + " at " + contractAddress);
      console.log("contract " + className + " at " + contract.address);
    }
    else {
      var chainContract = this.chainManager.getContract(className, contract.compiled.code, realArgs);

      if (chainContract != undefined) {
        console.log("contract " + className + " is unchanged and already deployed at " + chainContract.address);
        this.deployedContracts[className] = chainContract.address;
        this.execute_cmds(contract.onDeploy);
      }
      else {

        contractObject = web3.eth.contract(contract.compiled.info.abiDefinition);

        contractParams = realArgs.slice();
        contractParams.push({
          from: primaryAddress,
          data: contract.compiled.code,
          gas: contract.gasLimit,
          gasPrice: contract.gasPrice
        });

        console.log('trying to obtain ' + className + ' address...');

        while((receipt = this.deploy_contract(contractObject, contractParams)) === false) {
          console.log("timeout... failed to deploy contract.. retrying...");
        }

        var contractAddress = receipt.contractAddress;

        if (web3.eth.getCode(contractAddress) === "0x") {
          console.log("=========");
          console.log("contract was deployed at " + contractAddress + " but doesn't seem to be working");
          console.log("try adjusting your gas values");
          console.log("=========");
        }
        else {
          console.log("deployed " + className + " at " + contractAddress);
          this.chainManager.addContract(className, contract.compiled.code, realArgs, contractAddress);
          this.chainManager.save();
        }

        this.deployedContracts[className] = contractAddress;

        this.execute_cmds(contract.onDeploy);
      }
    }
  }

};

Deploy.prototype.execute_cmds = function(cmds) {
  if (cmds == undefined || cmds.length === 0) return;

  eval(this.generate_abi_file());
  for (var i = 0; i < cmds.length; i++) {
    var cmd = cmds[i];

    for(className in this.deployedContracts) {
      var contractAddress = this.deployedContracts[className];

      var re = new RegExp("\\$" + className, 'g');
      cmd = cmd.replace(re, '"' + contractAddress + '"');
    }

    console.log("executing: " + cmd);
    eval(cmd);
  }
}

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

