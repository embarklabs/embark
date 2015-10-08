var shelljs = require('shelljs');
var shelljs_global = require('shelljs/global');
var web3 = require('web3');
var fs = require('fs');
var solc = require('solc');

Compiler = function(blockchainConfig) {
  this.blockchainConfig = blockchainConfig;
};

Compiler.prototype.init = function(env) {
  var config = this.blockchainConfig.config(env);
  console.log("address is : " + primaryAddress);
};

Compiler.prototype.compile_solidity = function(contractFile) {
  var source = fs.readFileSync(contractFile).toString();
  var output = solc.compile(source, 1);

  var json = output.contracts;

  compiled_object = {}

  for (var className in json) {
    var contract = json[className];

    compiled_object[className] = {};
    compiled_object[className].code = contract.bytecode;
    compiled_object[className].info = {};
    compiled_object[className].info.abiDefinition = JSON.parse(contract.interface);
  }

  return compiled_object;
};

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
