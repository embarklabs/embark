let async = require('../../utils/async_extend.js');
const shelljs = require('shelljs');
const path = require('path');

class Vyper {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.contractDirectories = options.contractDirectories;

    embark.registerCompiler(".py", this.compile_vyper.bind(this));
  }

  static compileVyperContract(filename, compileABI, callback) {
    const params = compileABI ?  '-f json ' : '';
    shelljs.exec(`vyper ${params}${filename}`, {silent: true}, (code, stdout, stderr) => {
      if (stderr) {
        return callback(stderr);
      }
      if (code !== 0) {
        return callback(`Vyper exited with error code ${code}`);
      }
      if (!stdout) {
        return callback('Execution returned no result');
      }
      callback(null, stdout.replace(/\n/g, ''));
    });
  }

  compile_vyper(contractFiles, cb) {
    let self = this;
    if (!contractFiles || !contractFiles.length) {
      return cb();
    }
    self.logger.info("compiling Vyper contracts...");
    const compiled_object = {};
    async.each(contractFiles,
      function (file, fileCb) {
        const className = path.basename(file.filename).split('.')[0];
        compiled_object[className] = {};
        async.parallel([
          function getByteCode(paraCb) {
            Vyper.compileVyperContract(file.filename, false, (err, byteCode) => {
              if (err) {
                return paraCb(err);
              }
              compiled_object[className].runtimeBytecode = byteCode;
              compiled_object[className].realRuntimeBytecode = byteCode;
              compiled_object[className].code = byteCode;
              paraCb();
            });
          },
          function getABI(paraCb) {
            Vyper.compileVyperContract(file.filename, true, (err, ABIString) => {
              if (err) {
                return paraCb(err);
              }
              let ABI = [];
              try {
                ABI = JSON.parse(ABIString);
              } catch (e) {
                return paraCb('ABI is not valid JSON');
              }
              compiled_object[className].abiDefinition = ABI;
              paraCb();
            });
          }
        ], fileCb);
      },
      function (err) {
        cb(err, compiled_object);
      });
  }
}

module.exports = Vyper;
