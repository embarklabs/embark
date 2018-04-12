let async = require('../../utils/async_extend.js');
const shelljs = require('shelljs');

class Vyper {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.contractDirectories = options.contractDirectories;

    console.log('Construct VYPER');
    embark.registerCompiler(".py", this.compile_vyper.bind(this));
  }

  compile_vyper(contractFiles, cb) {
    let self = this;
    async.waterfall([
      function compileContracts(callback) {
        self.logger.info("compiling vyper contracts...");
        async.each(contractFiles,
            function(file, fileCb) {
                shelljs.exec(`vyper ${file.filename}`, (code, stdout, stderr) => {
                  console.log('Code', code);
                  console.log('Stdout', stdout);
                  console.log('Stderr', stderr);
                  fileCb();
                });
            },
            function (err) {
              process.exit(); // TODO remove me
              callback(err);
            });
      },
      function createCompiledObject(output, callback) {
        let json = output.contracts;

        if (!output || !output.contracts) {
          return callback(new Error("error compiling for unknown reasons"));
        }

        if (Object.keys(output.contracts).length === 0 && output.sourceList.length > 0) {
          return callback(new Error("error compiling. There are sources available but no code could be compiled, likely due to fatal errors in the solidity code").message);
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

module.exports = Vyper;
