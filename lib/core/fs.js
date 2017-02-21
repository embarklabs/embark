var fs = require('fs-extra');
var utils = require('./utils.js');

function mkdirpSync() {
  return fs.mkdirpSync.apply(fs.mkdirpSync, arguments);
}

function copySync() {
  return fs.copySync.apply(fs.copySync, arguments);
}

function writeFileSync() {
  return fs.writeFileSync.apply(fs.writeFileSync, arguments);
}

function readFileSync() {
  return fs.readFileSync.apply(fs.readFileSync, arguments);
}

function readJSONSync() {
  return fs.readJSONSync.apply(fs.readJSONSync, arguments);
}

function writeJSONSync() {
  return fs.writeJSONSync.apply(fs.writeJSONSync, arguments);
}

function existsSync(){
  return fs.existsSync.apply(fs.existsSync, arguments);
}

// returns embarks root directory
function embarkPath(fileOrDir) {
  return utils.joinPath(__dirname, '/../../', fileOrDir);
}

module.exports = {
  mkdirpSync: mkdirpSync,
  copySync: copySync,
  readFileSync: readFileSync,
  writeFileSync: writeFileSync,
  readJSONSync: readJSONSync,
  writeJSONSync: writeJSONSync,
  existsSync: existsSync,
  embarkPath: embarkPath
};
