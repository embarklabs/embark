var Web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var mkdirp = require('mkdirp');
var Pudding = require('ether-pudding');
var Generator = require("ether-pudding/generator");
var Loader = require("ether-pudding/loader");
var Config = require('./config/config.js');

Deploy = function(env, contractFiles, blockchainConfig, contractsConfig, chainManager, withProvider, withChain, _web3) {

  var web3 = (_web3 !== undefined) ? _web3 : new Web3();
  this.contractsManager = contractsConfig;
  this.contractsConfig = this.contractsManager.config(env);
  this.deployedContracts = {};
  this.blockchainConfig = blockchainConfig;

  try {
    if (withProvider) {
      web3.setProvider(new web3.providers.HttpProvider("http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort));
    }
    primaryAddress = web3.eth.coinbase;
    web3.eth.defaultAccount = primaryAddress;
  } catch (e) {
    throw new Error("==== can't connect to " + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + " check if an ethereum node is running");
  }

  this.chainManager = chainManager;
  this.chainManager.init(env, this.blockchainConfig, web3);
  this.withChain = withChain;
  this.puddingContracts = {};
  this.web3 = web3;

  console.log("primary account address is : " + primaryAddress);
};

Deploy.prototype.deploy_contract = function(contractObject, contractParams, cb) {
  var callback = function(e, contract) {    
    if(!e) {
       if(!contract.address) {
           console.log("currently processed by transaction...\n" + contract.transactionHash); // The hash of the transaction, which deploys the contract
       } else {
           cb(contract.address); //return contract address
       }
    }
    else {
      //console.log(arguments);
      //console.log("error deploying");
      //console.log("Deployment Error: " + e)
      //exit();
    }
  }

  contractParams.push(callback);

  contractObject["new"].apply(contractObject, contractParams);
}

Deploy.prototype.deploy_contracts = function(env, cb) {
  this.contractsManager.compileContracts(env);
  var all_contracts = this.contractsManager.all_contracts;
  this.contractDB = this.contractsManager.contractDB;
  this.deployedContracts = {};

  this.deploy_contract_list(all_contracts.length, env, all_contracts, cb);
}

Deploy.prototype.deploy_contract_list = function(index, env, all_contracts, cb) {
  if(index === 0) {
    cb();
  }
  else {
    var _this = this;
    this.deploy_contract_list(index - 1, env, all_contracts, function() {
      var className = all_contracts[index - 1];
      _this.deploy_a_contract(env, className, cb);
    });
  }
}

Deploy.prototype.deploy_a_contract = function(env, className, cb) {
    var web3 = this.web3;
    var contractDependencies = this.contractsManager.contractDependencies;
    var contract = this.contractDB[className];
    var puddingContracts = this.puddingContracts;

    if (contract.deploy === false) { //find way to not skip this and instead store it for later deployment in the pudding loader client side
      console.log("skipping " + className);
      cb();
      return;
    }

    var realArgs = [];
    for (var l = 0; l < contract.args.length; l++) {
      arg = contract.args[l];
      realArgs.push(arg);
    }

    if (contract.address !== undefined) {
      this.deployedContracts[className] = contract.address;

      console.log("contract " + className + " at " + contract.address);
      cb();
    }
    else {
      var chainContract = this.chainManager.getContract(className, contract.compiled.code, realArgs);

      if (chainContract != undefined && web3.eth.getCode(chainContract.address) !== "0x") {
        console.log("contract " + className + " is unchanged and already deployed at " + chainContract.address);
        this.deployedContracts[className] = chainContract.address;
        this.execute_cmds(contract.onDeploy);
        puddingContracts[className+"Contract"] = {abi: contract.compiled.info.abiDefinition, binary: contract.compiled.code, address: chainContract.address}
        cb();
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

        var _this = this;
        this.deploy_contract(contractObject, contractParams, function(contractAddress) {
          if (web3.eth.getCode(contractAddress) === "0x") {
            console.log("=========");
            console.log("contract was deployed at " + contractAddress + " but doesn't seem to be working");
            console.log("try adjusting your gas values");
            console.log("=========");
          }
          else {
            console.log("deployed " + className + " at " + contractAddress);
            _this.chainManager.addContract(className, contract.compiled.code, realArgs, contractAddress);
            if (_this.withChain) {
              _this.chainManager.save();
            }
          }

          _this.deployedContracts[className] = contractAddress;

          _this.execute_cmds(contract.onDeploy);

          puddingContracts[className+"Contract"] = {abi: contract.compiled.info.abiDefinition, binary: contract.compiled.code, address: contractAddress}

          cb();
        });

      }
    }
}

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

Deploy.prototype.generate_provider_file = function() {
  var result = "";
  result = "var Web3 = require('web3'); var web3 = new Web3;";
  result += "web3.setProvider(new web3.providers.HttpProvider('http://" + this.blockchainConfig.rpcHost + ":" + this.blockchainConfig.rpcPort + "'));";
  return result;
}

Deploy.prototype.generate_abi_file = function(callback) {
  
    var result = "";
    var contractNames = [];
    var web3 = this.web3;

    mkdirp(process.cwd() + "/generated/"); //TODO: integrate this process with Grunt, for now a hack
    mkdirp(process.cwd() + "/generated/tmp/"); //Second TODO: Need to automate via Grunt to clean up the Ma Puddinz library before every call
    mkdirp(process.cwd() + "/generated/tmp/Ma_Puddinz/");
    Generator.save(this.puddingContracts, process.cwd() + "/generated/tmp/Ma_Puddinz/");

    for (className in this.puddingContracts){
      contractNames.push(className);
    }
    var _this = this;
    Loader.packageSource(process.cwd() + "/generated/tmp/Ma_Puddinz/", function(error, source) {
      if(source){
        result += source + "Pudding.setWeb3(web3); Pudding.defaults({from: \"" + web3.eth.defaultAccount + "\"}); Pudding.load([" + contractNames.join(', ') + "], window);";
        callback(result);
      }
    });

  
};

Deploy.prototype.generate_and_write_abi_file = function(destFile) {
  var result = this.generate_abi_file();
  grunt.file.write(destFile, result);
};

module.exports = Deploy;
