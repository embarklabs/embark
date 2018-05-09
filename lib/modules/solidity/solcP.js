let solc;

const fs = require('fs-extra');
const path = require('path');
const constants = require('../../constants');
const Utils = require('../../utils/utils');

function findImports(filename) {
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

process.on('message', function (msg) {
  if (msg.action === 'loadCompiler') {
    solc = require(msg.solcLocation);
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    // TODO: only available in 0.4.11; need to make versions warn about this
    let output = solc.compileStandardWrapper(JSON.stringify(msg.jsonObj), findImports);
    process.send({result: "compilation", output: output});
  }
});

process.on('exit', function () {
  process.exit(0);
});

