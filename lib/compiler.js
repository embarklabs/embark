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

Compiler.prototype.compile_solidity = function(contractFile) {
  var cmd, result, output, version, json, compiled_object;

  cmd = "solc --version";

  result = exec(cmd, {silent: true});
  output = result.output;
  version = output.split('\n')[1].split(' ')[1].slice(0,5);

  if (version == '0.1.1') {
    cmd = "solc --input-file " + contractFile + " --combined-json binary,json-abi";
  }
  else {
    cmd = "solc --input-file " + contractFile + " --combined-json bin,abi";
  }

  result = exec(cmd, {silent: true});
  output = result.output;

  if (result.code === 1) {
    if (version == '0.1.1' || version == '0.1.0'){
      throw new Error(result.output);
    }
  }

  json = JSON.parse(output).contracts;
  compiled_object = {}

  for (var className in json) {
    var contract = json[className];

    compiled_object[className] = {};
    compiled_object[className].code = contract.binary || contract.bin;
    compiled_object[className].info = {};
    compiled_object[className].info.abiDefinition = JSON.parse(contract["abi"] || contract["json-abi"]);
  }

  return compiled_object;
}

Compiler.prototype.compile_serpent = function(contractFile) {
  var cmd, result, output, json, compiled_object;

  cmd = "serpent compile " + contractFile;

  result = exec(cmd, {silent: true});
  code = result.output;

  if (result.code === 1) {
    throw new Error(result.output);
  }

  cmd = "serpent mk_full_signature " + contractFile;
  result = exec(cmd, {silent: true});

  if (result.code === 1) {
    throw new Error(result.output);
  }

  json = JSON.parse(result.output.trim());
  className = contractFile.split('.')[0].split("/").pop();

  for (var i=0; i < json.length; i++) {
    var elem = json[i];

    if (elem.outputs.length > 0) {
      elem.constant = true;
    }
  }

  compiled_object = {}
  compiled_object[className] = {};
  compiled_object[className].code = code.trim();
  compiled_object[className].info = {};
  compiled_object[className].info.abiDefinition = json;

  return compiled_object;
}


Compiler.prototype.compile = function(contractFile) {
  var extension = contractFile.split('.')[1];

  if (extension === 'sol') {
    return this.compile_solidity(contractFile);
  }
  else if (extension === 'se') {
    return this.compile_serpent(contractFile);
  }
  else {
    throw new Error("extension not known");
  }
};

module.exports = Compiler;
