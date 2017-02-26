/*jshint esversion: 6, loopfunc: true */
var async = require('async');
var SolcW = require('./solcW.js');

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
  this.logger = options.logger;
};

Compiler.prototype.compile_contracts = function(contractFiles, cb) {

  var available_compilers = {
    //".se": this.compile_serpent
    ".sol": this.compile_solidity.bind(this)
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
  var self = this;
  var input = {};
  var solcW;
  async.waterfall([
    function prepareInput(callback) {
      for (var i = 0; i < contractFiles.length; i++){
        // TODO: this depends on the config
        var filename = contractFiles[i].filename.replace('app/contracts/','');
        input[filename] = contractFiles[i].content.toString();
      }
      console.log(input);
      callback();
    },
    function loadCompiler(callback) {
      // TODO: there ino need to load this twice
      solcW = new SolcW();
      if (solcW.isCompilerLoaded()) {
        callback();
      } else {
        self.logger.info("loading solc compiler..");
        solcW.load_compiler(function(){
          callback();
        });
      }
    },
    function compileContracts(callback) {
      self.logger.info("compiling contracts...");
      solcW.compile({sources: input}, 1, function(output) {
        // TODO: check error is handled properly
        //if (output.errors) {
        //  throw new Error ("Solidity errors: " + output.errors);
        //}
        callback(null, output);
      });
    },
    function createCompiledObject(output, callback) {
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
      callback(null, compiled_object);
    }
  ], function(err, result) {
    cb(result);
  });
};

module.exports = Compiler;
