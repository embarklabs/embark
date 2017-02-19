var fs = require('fs-extra');

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

module.exports = {
  mkdirpSync: mkdirpSync,
  copySync: copySync,
  readFileSync: readFileSync,
  writeFileSync: writeFileSync,
  readJSONSync: readJSONSync,
  writeJSONSync: writeJSONSync
};

