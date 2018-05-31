const fs = require('fs-extra');
const path = require('path');
const constants = require('../../constants');
const Utils = require('../../utils/utils');

const ProcessWrapper = require('../../process/processWrapper');

class SolcProcess extends ProcessWrapper {

  findImports(filename) {
    if (filename.startsWith('http') || filename.startsWith('git')) {
      const fileObj = Utils.getExternalContractUrl(filename);
      filename = fileObj.filePath;
    }
    if (fs.existsSync(filename)) {
      return {contents: fs.readFileSync(filename).toString()};
    }
    if (fs.existsSync(path.join('./node_modules/', filename))) {
      return {contents: fs.readFileSync(path.join('./node_modules/', filename)).toString()};
    }
    if (fs.existsSync(path.join(constants.httpContractsDirectory, filename))) {
      return {contents: fs.readFileSync(path.join('./.embark/contracts', filename)).toString()};
    }
    return {error: 'File not found'};
  }

  loadCompiler(solcLocation) {
    this.solc = require(solcLocation);
  }

  compile(jsonObj, cb) {
    // TODO: only available in 0.4.11; need to make versions warn about this
    let output = this.solc.compileStandardWrapper(JSON.stringify(jsonObj), this.findImports);
    cb(output);
  }

}

let solcProcess;

process.on('message', function (msg) {
  if (msg.action === "init") {
    solcProcess = new SolcProcess(msg.options);
    return process.send({result: "initiated"});
  }

  if (msg.action === 'loadCompiler') {
    solcProcess.loadCompiler(msg.requirePath);
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    solcProcess.compile(msg.jsonObj, (output) => {
      process.send({result: "compilation-" + msg.id, output: output});
    });
  }
});

