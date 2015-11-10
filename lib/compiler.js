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
};

Compiler.prototype.compile_solidity = function(contractFiles) {
  var cmd, result, output, version, json, compiled_object;

  var input = {}

  for (var i = 0; i < contractFiles.length; i++){
    //console.log(contractFiles[i]);
    //input[contractFiles[i].substring(14)] = fs.readFileSync(contractFiles[i]).toString();
    input[contractFiles[i].split('/')[3]] = fs.readFileSync(contractFiles[i]).toString();
  }

  var output = solc.compile({sources: input}, 1);
  if (output.errors && output.errors.length > 0) {
      //TODO: maybe a join is best
     throw new Error("Solidity errors: " + output.errors);
  }

  var json = output.contracts;

  cmd = "solc " + contractFile + " --combined-json bin,abi";

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

Compiler.prototype.compile_serpent = function(contractFiles) {
  var cmd, result, output, json, compiled_object;

  //TODO: figure out how to compile multiple files and get the correct json
  var contractFile = contractFiles[0];

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

Compiler.prototype.compile = function(contractFiles) {
  var solidity = [], serpent = [];
  
  for (contract in contractFiles) {
    var extension = contractFile.split('.')[1];
    if (extension === 'sol') {
      solidity.push(contractFile);
    }
    else if (extension === 'se') {
      serpent.push(contractFile);
    }
    else {
      throw new Error("extension not known");
    }
  }

  if (solidity.length > 0) return compile_solidity(solidity);
  if (serpent.length > 0) return compile_serpent(serpent);
};

module.exports = Compiler;
