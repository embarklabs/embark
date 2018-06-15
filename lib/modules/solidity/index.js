let async = require('../../utils/async_extend.js');
let SolcW = require('./solcW.js');

class Solidity {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.ipc = options.ipc;
    this.contractDirectories = embark.config.contractDirectories;
    this.solcAlreadyLoaded = false;
    this.solcW = null;
    this.useDashboard = options.useDashboard;

    embark.registerCompiler(".sol", this.compile_solidity.bind(this));
  }

  compile_solidity(contractFiles, cb) {
    if (!contractFiles.length) {
      return cb();
    }
    let self = this;
    let input = {};
    async.waterfall([
      function prepareInput(callback) {
        async.each(contractFiles,
                   function(file, fileCb) {
                     let filename = file.filename;

                     for (let directory of self.contractDirectories) {
                       let match = new RegExp("^" + directory);
                       filename = filename.replace(match, '');
                     }

                     file.content(function(fileContent) {
                       if (!fileContent) {
                         self.logger.error(__('Error while loading the content of ') + filename);
                         return fileCb();
                       }
                       input[filename] = {content: fileContent.replace(/\r\n/g, '\n')};
                       fileCb();
                     });
                   },
                   function (err) {
                     callback(err);
                   }
        );
      },
      function loadCompiler(callback) {
        if (self.solcAlreadyLoaded) {
          return callback();
        }
        self.solcW = new SolcW({logger: self.logger, events: self.events, ipc: self.ipc, useDashboard: self.useDashboard});

        self.logger.info(__("loading solc compiler") + "..");
        self.solcW.load_compiler(function (err) {
          self.solcAlreadyLoaded = true;
          callback(err);
        });
      },
      function compileContracts(callback) {
        self.logger.info(__("compiling solidity contracts") + "...");
        let jsonObj =  {
          language: 'Solidity',
          sources: input,
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            },
            outputSelection: {
              '*': {
                '*': ['abi', 'metadata', 'userdoc', 'devdoc', 'evm.legacyAssembly', 'evm.bytecode', 'evm.deployedBytecode', 'evm.methodIdentifiers', 'evm.gasEstimates']
              }
            }
          }
        };

        self.solcW.compile(jsonObj, function (err, output) {
          if(err){
            return callback(err);
          }
          if (output.errors) {
            for (let i=0; i<output.errors.length; i++) {
              if (output.errors[i].type === 'Warning') {
                self.logger.warn(output.errors[i].formattedMessage);
              }
              if (output.errors[i].type === 'Error' || output.errors[i].severity === 'error') {
                return callback(new Error("Solidity errors: " + output.errors[i].formattedMessage).message);
              }
            }
          }
          callback(null, output);
        });
      },
      function createCompiledObject(output, callback) {
        let json = output.contracts;

        if (!output || !output.contracts) {
          return callback(new Error(__("error compiling for unknown reasons")));
        }

        if (Object.keys(output.contracts).length === 0 && output.sourceList.length > 0) {
          return callback(new Error(__("error compiling. There are sources available but no code could be compiled, likely due to fatal errors in the solidity code")).message);
        }

        let compiled_object = {};

        for (let contractFile in json) {
          for (let contractName in json[contractFile]) {
            let contract = json[contractFile][contractName];

            const className = contractName;
            const filename = contractFile;

            compiled_object[className] = {};
            compiled_object[className].code = contract.evm.bytecode.object;
            compiled_object[className].runtimeBytecode = contract.evm.deployedBytecode.object;
            compiled_object[className].realRuntimeBytecode = contract.evm.deployedBytecode.object.slice(0, -68);
            compiled_object[className].swarmHash = contract.evm.deployedBytecode.object.slice(-68).slice(0, 64);
            compiled_object[className].gasEstimates = contract.evm.gasEstimates;
            compiled_object[className].functionHashes = contract.evm.methodIdentifiers;
            compiled_object[className].abiDefinition = contract.abi;
            compiled_object[className].filename = filename;
          }
        }

        callback(null, compiled_object);
      }
    ], function (err, result) {
      cb(err, result);
    });
  }

}

module.exports = Solidity;
