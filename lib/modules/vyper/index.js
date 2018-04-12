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
    async.waterfall([
      function compileContracts(callback) {
        self.logger.info("compiling vyper contracts...");
        const compiled_object = {};
        async.each(contractFiles,
          function (file, fileCb) {
            const fileNameOnly = path.basename(file.filename);
            compiled_object[fileNameOnly] = {};
            async.parallel([
              function getByteCode(paraCb) {
                shelljs.exec(`vyper ${file.filename}`, { silent: true }, (code, stdout, stderr) => {
                  if (stderr) {
                    return paraCb(stderr);
                  }
                  if (code !== 0) {
                    return paraCb(`Vyper exited with error code ${code}`)
                  }
                  if (!stdout) {
                    return paraCb('Execution returned no bytecode');
                  }
                  compiled_object[fileNameOnly].code = stdout.replace(/\n/g, '');
                  paraCb();
                });
              },
              function getABI(paraCb) {
                shelljs.exec(`vyper -f json ${file.filename}`, { silent: true }, (code, stdout, stderr) => {
                  if (stderr) {
                    return paraCb(stderr);
                  }
                  if (code !== 0) {
                    return paraCb(`Vyper exited with error code ${code}`)
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
                  compiled_object[fileNameOnly].abiDefinition = ABI;
                  paraCb();
                });
              }
            ], fileCb);
          },
          function (err) {
            callback(err, compiled_object);
          });
      }
    ], function (err, result) {
      cb(err, result);
    });
  }

}

module.exports = Vyper;
