const parseJson = require('parse-json');
const os = require('os');
let path = require('path');
let fs = require('fs-extra');
let utils = require('../utils/utils.js');
require('colors');

const pathConfigs = {
  DAPP_PATH: process.env.DAPP_PATH,
  EMBARK_PATH: process.env.EMBARK_PATH
};

function restrictPath(receiver, binding, count, args) {
  const dapp = dappPath();
  const embark = embarkPath();

  const allowedRoots = [
    dapp,
    embark,
    os.tmpdir()
  ];

  let allInsideRestricted = true;

  for(let i = 0; i < count; i++) {
    let resolved = path.resolve(dapp, args[i]);
    allInsideRestricted = allowedRoots.some(p => { return resolved.indexOf(p) === 0; });
    if(!allInsideRestricted) break;
  }

  if(allInsideRestricted) return receiver.apply(binding, args);
  throw new Error('EPERM: Operation not permitted');
}

function mkdirpSync() {
  return restrictPath(fs.mkdirpSync, fs.mkdirpSync, 1, arguments);
}

function mkdirp() {
  return restrictPath(fs.mkdirp, fs.mkdirp, 1, arguments);
}

function readdir() {
  return restrictPath(fs.readdir, fs.readdir, 1, arguments);
}

function stat() {
  return restrictPath(fs.stat, fs.stat, 1, arguments);
}

function remove() {
  return restrictPath(fs.remove, fs.remove, 1, arguments);
}

function copy() {
  return restrictPath(fs.copy, fs.copy, 2, arguments);
}

function copySync() {
  return restrictPath(fs.copySync, fs.copySync, 2, arguments);
}

function move(){
  return restrictPath(fs.move, fs.move, 2, arguments);
}

function moveSync() {
  return restrictPath(fs.moveSync, fs.moveSync, 2, arguments);
}

function appendFileSync() {
  return restrictPath(fs.appendFileSync, fs.writeFileSync, 1, arguments);
}

function writeFile() {
  return restrictPath(fs.writeFile, fs.writeFileSync, 1, arguments);
}

function writeFileSync() {
  return restrictPath(fs.writeFileSync, fs.writeFileSync, 1, arguments);
}

function readFile() {
  return restrictPath(fs.readFile, fs.readFile, 1, arguments);
}

function readFileSync() {
  return restrictPath(fs.readFileSync, fs.readFileSync, 1, arguments);
}

function readdirSync() {
  return restrictPath(fs.readdirSync, fs.readdirSync, 1, arguments);
}

function statSync() {
  return restrictPath(fs.statSync, fs.statSync, 1, arguments);
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
  return restrictPath(fs.writeJSONSync, fs.writeJSONSync, 1, arguments);
}

function writeJson() {
  return restrictPath(fs.writeJson, fs.writeJson, 1, arguments);
}

function existsSync() {
  return restrictPath(fs.existsSync, fs.existsSync, 1, arguments);
}

function access() {
  return restrictPath(fs.access, fs.access, 1, arguments);
}

function removeSync() {
  return restrictPath(fs.removeSync, fs.removeSync, 1, arguments);
}

function anchoredPath(envAnchor, ...args) {
  let anchor = pathConfigs[envAnchor];
  if (!pathConfigs[envAnchor]) {
    console.error(`process.env.${envAnchor} was not set`.bold.red);
    process.exit(1);
  }
  return utils.joinPath(anchor, ...args);
}

function embarkPath() {
  return anchoredPath('EMBARK_PATH', ...arguments);
}

function dappPath() {
  return anchoredPath('DAPP_PATH', ...arguments);
}

function pkgPath() {
  return anchoredPath('PKG_PATH', ...arguments);
}

function createWriteStream() {
  return restrictPath(fs.createWriteStream, fs.createWriteStream, 1, arguments);
}

function tmpDir() {
  let os = require('os');
  return utils.joinPath(os.tmpdir(), ...arguments);
}

function copyPreserve(sourceFilePath, targetFilePath) {
  const path = require('path');
  let ext = 1;
  let preserved = targetFilePath;
  while (fs.existsSync(preserved)) {
    let extname = path.extname(targetFilePath);
    preserved = utils.joinPath(
      path.dirname(targetFilePath),
      `${path.basename(targetFilePath, extname)}.${ext}${extname}`
    );
    ext++;
  }
  if (preserved !== targetFilePath) {
    fs.copySync(targetFilePath, preserved);
  }
  fs.copySync(sourceFilePath, targetFilePath);
}

function outputFileSync(){
  return fs.outputFileSync.apply(fs.outputFile, arguments);
}

module.exports = {
  access,
  appendFileSync,
  copy,
  copySync,
  createWriteStream,
  embarkPath,
  existsSync,
  mkdirp,
  mkdirpSync,
  move,
  moveSync,
  outputFileSync,
  readFile,
  readFileSync,
  readJSONSync,
  readdir,
  readdirSync,
  remove,
  removeSync,
  stat,
  statSync,
  tmpDir,
  writeFile,
  writeFileSync,
  writeJSONSync,
  copyPreserve,
  dappPath,
  pkgPath,
  writeJson
};
