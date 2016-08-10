var web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var readYaml = require('read-yaml');
var Compiler = require('./compiler.js');
var Config = require('./config/config.js');
var BigNumber = require('bignumber.js');

// this is a temporary module to deploy a single contract, will be refactored

SingleDeploy = function(compiledContracts, _web3) {
  if (_web3 !== undefined) {
    web3 = _web3;
  }
  this.compiledContracts = compiledContracts;
};

SingleDeploy.waitForContract = function(transactionHash, cb) {
  web3.eth.getTransactionReceipt(transactionHash, function(e, receipt) {
    if (!e  && receipt && receipt.contractAddress !== undefined) {
      cb(receipt.contractAddress);
    }
    else {
      Deploy.waitForContract(transactionHash, cb);
    }
  });
};

SingleDeploy.prototype.deploy_contract = function(contractObject, contractParams, cb) {
  var callback = function(e, contract) {
    if(!e && contract.address !== undefined) {
      cb(contract.address);
    }
    else {
      Deploy.waitForContract(contract.transactionHash, cb);
    }
  };

  contractParams.push(callback);
  contractObject["new"].apply(contractObject, contractParams);
};

Deploy.prototype.deploy_a_contract = function(className, args, cb) {
  var contract = this.compiledContracts[className];
  var contractObject = web3.eth.contract(contract.compiled.info.abiDefinition);

  contractParams = args.slice();
  contractParams.push({
    from: primaryAddress,
    data: contract.compiled.code,
    gas: contract.gasLimit,
    gasPrice: contract.gasPrice
  });

  console.log('trying to obtain ' + className + ' address...');

  this.deploy_contract(contractObject, contractParams, function(contractAddress) {
    if (web3.eth.getCode(contractAddress) === "0x") {
      console.log("=========");
      console.log("contract was deployed at " + contractAddress + " but doesn't seem to be working");
      console.log("try adjusting your gas values");
      console.log("=========");
    }

    cb();
  });

};

SingleDeploy.prototype.generate_provider_file = function() {
  var result = "";

  result += "if (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {";
  result += 'web3 = new Web3(web3.currentProvider);';
  result += "} else if (typeof Web3 !== 'undefined') {";
  result += 'web3 = new Web3(new Web3.providers.HttpProvider("http://' + this.blockchainConfig.rpcHost + ':' + this.blockchainConfig.rpcPort + '"));';
  result += '}';
  result += "web3.eth.defaultAccount = web3.eth.accounts[0];";

  return result;
};

SingleDeploy.prototype.generate_abi_file = function() {
  var result = "";

  result += 'blockchain = '+JSON.stringify(this.blockchainConfig)+';';

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
  result += 'contractDB = '+JSON.stringify(this.contractDB)+';'

  return result;
};

SingleDeploy.prototype.generate_and_write_abi_file = function(destFile) {
  var result = this.generate_abi_file();
  grunt.file.write(destFile, result);
};

module.exports = SingleDeploy;
