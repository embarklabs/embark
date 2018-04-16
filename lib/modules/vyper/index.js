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
            shelljs.exec(`vyper ${file.filename}`, {silent: true}, (code, stdout, stderr) => {
              if (stderr) {
                return paraCb(stderr);
              }
              if (code !== 0) {
                return paraCb(`Vyper exited with error code ${code}`);
              }
              if (!stdout) {
                return paraCb('Execution returned no bytecode');
              }
              const byteCode = stdout.replace(/\n/g, '');
              compiled_object[className].runtimeBytecode = byteCode;
              compiled_object[className].realRuntimeBytecode = byteCode;
              compiled_object[className].code = byteCode;
              paraCb();
            });
          },
          function getABI(paraCb) {
            shelljs.exec(`vyper -f json ${file.filename}`, {silent: true}, (code, stdout, stderr) => {
              if (stderr) {
                return paraCb(stderr);
              }
              if (code !== 0) {
                return paraCb(`Vyper exited with error code ${code}`);
              }
              if (!stdout) {
                return paraCb('Execution returned no ABI');
              }
              let ABI = [];
              try {
                ABI = JSON.parse(stdout.replace(/\n/g, ''));
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
