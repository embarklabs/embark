import { __ } from 'embark-i18n';
const async = require('async');
const shelljs = require('shelljs');
const path = require('path');

class Vyper {

  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.contractDirectories = embark.config.contractDirectories;

    // FIXME: Use array of extensions instead of duplicatiing
    embark.registerCompiler(".py", this.compile_vyper.bind(this));
    embark.registerCompiler(".vy", this.compile_vyper.bind(this));
  }

  compileVyperContract(filename, compileABI, callback) {
    const self = this;
    const params = compileABI ?  '-f=json ' : '';
    shelljs.exec(`vyper ${params}${filename}`, {silent: true}, (code, stdout, stderr) => {
      if (stderr) {
        return callback(stderr);
      }
      if (code !== 0) {
        self.logger.error(stdout);
        return callback(__('Vyper exited with error code ') + code);
      }
      if (!stdout) {
        return callback(__('Execution returned no result'));
      }
      callback(null, stdout.replace(/\n/g, ''));
    });
  }

  compile_vyper(contractFiles, _options, cb) {
    const self = this;
    if (!contractFiles || !contractFiles.length) {
      return cb();
    }

    const vyper = shelljs.which('vyper');
    if (!vyper) {
      self.logger.warn(__('%s is not installed on your machine', 'Vyper'));
      self.logger.info(__('You can install it by visiting: %s', 'https://vyper.readthedocs.io/en/latest/installing-vyper.html'));
      return cb();
    }
    self.logger.info(__("compiling Vyper contracts") + "...");

    const compiled_object = {};
    async.each(contractFiles,
      function (file, fileCb) {
        const className = path.basename(file.path).split('.')[0];
        compiled_object[className] = {};
        async.parallel([
          function getByteCode(paraCb) {
            self.compileVyperContract(file.path, false, (err, byteCode) => {
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
            self.compileVyperContract(file.path, true, (err, ABIString) => {
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
