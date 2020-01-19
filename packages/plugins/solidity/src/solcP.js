import { ProcessWrapper } from 'embark-core';
const fs = require('fs-extra');
const semver = require('semver');

class SolcProcess extends ProcessWrapper {

  constructor(options) {
    super({pingParent: false});
    this._logger = options.logger;
    this._showSpinner = options.showSpinner === true;
  }

  findImports(filename) {
    if (fs.existsSync(filename)) {
      return {contents: fs.readFileSync(filename).toString()};
    }
    return {error: 'File not found'};
  }

  compile(jsonObj, cb) {
    // TODO: only available in 0.4.11; need to make versions warn about this
    try {
      let func = this.solc.compileStandardWrapper;
      const solcVersion = this.solc.version();
      if (semver.gte(solcVersion, '0.6.0')) {
        func = (json, importCb) => this.solc.compile(json, {import: importCb});
      } else if (semver.gte(solcVersion, '0.5.0')) {
        func = this.solc.compile;
      }
      let output = func(JSON.stringify(jsonObj), this.findImports.bind(this));
      cb(null, output);
    } catch (err) {
      cb(err.message || err);
    }
  }
}

let solcProcess;
process.on('message', (msg) => {
  if (msg.action === "init") {
    msg.options.logger = console;
    solcProcess = new SolcProcess(msg.options);
    return process.send({result: "initiated"});
  }

  else if (msg.action === 'loadCompiler') {
    solcProcess.solc = require(msg.requirePath);
    return process.send({result: "loadedCompiler"});
  }

  else if (msg.action === 'compile') {
    solcProcess.compile(msg.jsonObj, (err, output) => {
      process.send({result: "compilation-" + msg.id, err: err, output: output});
    });
  }
});
