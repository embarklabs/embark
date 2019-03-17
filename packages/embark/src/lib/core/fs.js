/* global module process require */

const {DAPP_PATH,
       DIAGRAM_PATH,
       EMBARK_PATH,
       PKG_PATH,
       anchoredValue} = require('./env');
const fs = require('fs-extra');
const os = require('os');
const parseJson = require('parse-json');
const path = require('path');
const utils = require('../utils/utils');
require('colors');

function mkdirpSync(...args) { return fs.mkdirpSync(...args); }

function mkdirp(...args) { return fs.mkdirp(...args); }

function readdir(...args) { return fs.readdir(...args); }

function stat(...args) { return fs.stat(...args); }

function remove(...args) { return fs.remove(...args); }

function copy(...args) { return fs.copy(...args); }

function copySync(...args) { return fs.copySync(...args); }

function move(...args) { return fs.move(...args); }

function moveSync(...args) { return fs.moveSync(...args); }

function symlink(...args) { return fs.symlink(...args); }

function appendFileSync(...args) { return fs.appendFileSync(...args); }

function writeFile(...args) { return fs.writeFile(...args); }

function writeFileSync(...args) { return fs.writeFileSync(...args); }

function readFile(...args) { return fs.readFile(...args); }

function readFileSync(...args) { return fs.readFileSync(...args); }

function readdirSync(...args) { return fs.readdirSync(...args); }

function statSync(...args) { return fs.statSync(...args); }

function readJSONSync(...args) {
  let json;
  try {
    json = parseJson(readFileSync(...args));
  } catch (e) {
    console.error('error: '.red + args[0].green.underline + ' ' + e.message.green);
    process.exit(1);
  }
  return json;
}

function writeJSONSync(...args) { return fs.writeJSONSync(...args); }

function outputJSONSync(...args) { return fs.outputJSONSync(...args); }

function writeJson(...args) { return fs.writeJson(...args); }

function existsSync(...args) { return fs.existsSync(...args); }

function ensureFileSync(...args) { return fs.ensureFileSync(...args); }

function ensureDirSync(...args) { return fs.ensureDirSync(...args); }

function access(...args) { return fs.access(...args); }

function removeSync(...args) { return fs.removeSync(...args); }

function anchoredPath(anchor, ...args) {
  return utils.joinPath(
    anchoredValue(anchor),
    ...args.map(path => path.replace(dappPath(), ''))
  );
}

function embarkPath(...args) { return anchoredPath(EMBARK_PATH, ...args); }

function dappPath(...args) { return anchoredPath(DAPP_PATH, ...args); }

function diagramPath(...args) { return anchoredPath(DIAGRAM_PATH, ...args); }

function ipcPath(basename, usePipePathOnWindows = false) {
  if (!(basename && typeof basename === 'string')) {
    throw new TypeError('first argument must be a non-empty string');
  }
  if (process.platform === 'win32' && usePipePathOnWindows) {
    return `\\\\.\\pipe\\${basename}`;
  }
  return utils.joinPath(
    tmpDir(`embark-${utils.sha512(dappPath()).slice(0, 8)}`),
    basename
  );
}

function pkgPath(...args) { return anchoredPath(PKG_PATH, ...args); }

function createWriteStream(...args) { return fs.createWriteStream(...args); }

function tmpDir(...args) { return utils.joinPath(os.tmpdir(), ...args); }

function copyPreserve(sourceFilePath, targetFilePath) {
  const implementation = (sourceFilePath, targetFilePath) => {
    let ext = 1;
    let preserved = targetFilePath;
    while (fs.existsSync(preserved)) {
      const extname = path.extname(targetFilePath);
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
  };

  return implementation(sourceFilePath, targetFilePath);
}

function outputFileSync(...args) { return fs.outputFileSync(...args); }

module.exports = {
  access,
  appendFileSync,
  copy,
  copyPreserve,
  copySync,
  createWriteStream,
  dappPath,
  diagramPath,
  embarkPath,
  existsSync,
  ensureFileSync,
  ensureDirSync,
  ipcPath,
  mkdirp,
  mkdirpSync,
  move,
  moveSync,
  outputFileSync,
  outputJSONSync,
  pkgPath,
  readFile,
  readFileSync,
  readJSONSync,
  readdir,
  readdirSync,
  remove,
  removeSync,
  stat,
  statSync,
  symlink,
  tmpDir,
  writeFile,
  writeFileSync,
  writeJSONSync,
  writeJson
};
