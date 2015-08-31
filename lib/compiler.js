var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');

Compiler = function(blockchainConfig) {
  this.blockchainConfig = blockchainConfig;
};

Compiler.prototype.init = function(env) {
  var config = this.blockchainConfig.config(env);

  try {
    web3.setProvider(new web3.providers.HttpProvider("http://" + config.rpcHost + ":" + config.rpcPort));
    primaryAddress = web3.eth.coinbase;
    web3.eth.defaultAccount = primaryAddress;
  } catch (e) {
    throw new Error("can't connect to " + config.rpcHost + ":" + config.rpcPort + " check if an ethereum node is running");
  }

  console.log("address is : " + primaryAddress);
};

Compiler.prototype.compile = function(contractFile) {
  var cmd, result, output, json, compiled_object;

  cmd = "solc --input-file " + contractFile + " --combined-json binary,json-abi";

  result = exec(cmd, {silent: true});
  output = result.output;

  if (result.code === 1) {
    throw new Error(result.output);
  }

  json = JSON.parse(output).contracts;
  compiled_object = {}

  for (var className in json) {
    var contract = json[className];

    compiled_object[className] = {};
    compiled_object[className].code = contract.binary;
    compiled_object[className].info = {};
    compiled_object[className].info.abiDefinition = JSON.parse(contract["json-abi"]);
  }

  return compiled_object;
};

module.exports = Compiler;
