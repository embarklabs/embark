const parseJson = require('parse-json');
let fs = require('fs-extra');
let utils = require('../utils/utils.js');
require('colors');

function mkdirpSync() {
  return fs.mkdirpSync.apply(fs.mkdirpSync, arguments);
}

function mkdirp() {
  return fs.mkdirp.apply(fs.mkdirp, arguments);
}

function copy() {
  return fs.copy.apply(fs.copy, arguments);
}

function copySync() {
  return fs.copySync.apply(fs.copySync, arguments);
}

function move(){
  return fs.move.apply(fs.move, arguments);
}

function moveSync() {
  return fs.moveSync.apply(fs.moveSync, arguments);
}

function appendFileSync() {
  return fs.appendFileSync.apply(fs.writeFileSync, arguments);
}

function writeFile() {
  return fs.writeFile.apply(fs.writeFileSync, arguments);
}

function writeFileSync() {
  return fs.writeFileSync.apply(fs.writeFileSync, arguments);
}

function readFile() {
  return fs.readFile.apply(fs.readFile, arguments);
}

function readFileSync() {
  return fs.readFileSync.apply(fs.readFileSync, arguments);
}

function readJSONSync() {
  let content = readFileSync.apply(readFileSync, arguments);
  try {
    return parseJson(content);
  } catch(e) {
    console.error("error: ".red + arguments[0].green.underline + " " + e.message.green);
    process.exit(0);
  }
}

function writeJSONSync() {
  return fs.writeJSONSync.apply(fs.writeJSONSync, arguments);
}

function writeJson() {
  return fs.writeJson.apply(fs.writeJson, arguments);
}

function existsSync() {
  return fs.existsSync.apply(fs.existsSync, arguments);
}

function access() {
  return fs.access.apply(fs.access, arguments);
}

function removeSync() {
  return fs.removeSync.apply(fs.removeSync, arguments);
}

function embarkPath() {
  const _embarkPath = process.env.EMBARK_PATH;
  if (!_embarkPath) {
    const errMsg = 'process.env.EMBARK_PATH was not set'.bold.red;
    console.error(errMsg);
    process.exit(1);
  }
  return utils.joinPath(_embarkPath, ...arguments);
}

function dappPath() {
  const _dappPath = process.env.DAPP_PATH;
  if (!_dappPath) {
    const errMsg = 'process.env.DAPP_PATH was not set'.bold.red;
    console.error(errMsg);
    process.exit(1);
  }
  return utils.joinPath(_dappPath, ...arguments);
}

function createWriteStream() {
  return fs.createWriteStream.apply(fs.createWriteStream, arguments);
}

function tmpDir() {
  let os = require('os');
  return utils.joinPath(os.tmpdir(), ...arguments);
}

module.exports = {
  mkdirpSync,
  mkdirp,
  copy,
  copySync,
  move,
  moveSync,
  readFile,
  readFileSync,
  appendFileSync,
  writeFile,
  writeFileSync,
  readJSONSync,
  writeJson,
  writeJSONSync,
  access,
  existsSync,
  removeSync,
  embarkPath,
  dappPath,
  createWriteStream,
  tmpDir
};
