/*jshint esversion: 6, loopfunc: true */
var solc = require('solc');
var async = require('async');

function asyncEachObject(object, iterator, callback) {
  async.each(
    Object.keys(object || {}),
    function(key, next){
      iterator(key, object[key], next);
    },
    callback
  );
}
async.eachObject = asyncEachObject;

var Compiler = function(options) {
  this.plugins = options.plugins;
};

Compiler.prototype.compile_contracts = function(contractFiles, cb) {

  var available_compilers = {
    //".se": this.compile_serpent
    ".sol": this.compile_solidity
  };

  if (this.plugins) {
    var compilerPlugins = this.plugins.getPluginsFor('compilers');
    if (compilerPlugins.length > 0) {
      compilerPlugins.forEach(function(plugin) {
        plugin.compilers.forEach(function(compilerObject) {
          available_compilers[compilerObject.extension] = compilerObject.cb;
        });
      });
    }
  }

  var compiledObject = {};

  async.eachObject(available_compilers,
    function(extension, compiler, callback) {
      // TODO: warn about files it doesn't know how to compile
      var matchingFiles = contractFiles.filter(function(file) {
        return (file.filename.match(/\.[0-9a-z]+$/)[0] === extension);
      });

      compiler.call(compiler, matchingFiles || [], function(compileResult) {
        Object.assign(compiledObject, compileResult);
        callback();
      });
    },
    function (err) {
      cb(compiledObject);
    }
  );
};

Compiler.prototype.compile_solidity = function(contractFiles, cb) {
  var input = {};

  for (var i = 0; i < contractFiles.length; i++){
    // TODO: this depends on the config
    var filename = contractFiles[i].filename.replace('app/contracts/','');
    input[filename] = contractFiles[i].content.toString();
  }

  var output = solc.compile({sources: input}, 1);

  if (output.errors) {
    throw new Error ("Solidity errors: " + output.errors);
  }

  var json = output.contracts;

  compiled_object = {};

  for (var className in json) {
    var contract = json[className];

    compiled_object[className] = {};
    compiled_object[className].code            = contract.bytecode;
    compiled_object[className].runtimeBytecode = contract.runtimeBytecode;
    compiled_object[className].gasEstimates    = contract.gasEstimates;
    compiled_object[className].functionHashes  = contract.functionHashes;
    compiled_object[className].abiDefinition   = JSON.parse(contract.interface);
  }

  cb(compiled_object);
};

module.exports = Compiler;
