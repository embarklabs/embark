/* global module process require */

const fs = require('fs-extra');
const parseJson = require('parse-json');
const path = require('path');
import { joinPath } from 'embark-utils';
import './env';

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

function createWriteStream(...args) { return fs.createWriteStream(...args); }

function copyPreserve(sourceFilePath, targetFilePath) {
  const implementation = (sourceFilePath, targetFilePath) => {
    let ext = 1;
    let preserved = targetFilePath;
    while (fs.existsSync(preserved)) {
      const extname = path.extname(targetFilePath);
      preserved = joinPath(
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
  existsSync,
  ensureFileSync,
  ensureDirSync,
  mkdirp,
  mkdirpSync,
  move,
  moveSync,
  outputFileSync,
  outputJSONSync,
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
  writeFile,
  writeFileSync,
  writeJSONSync,
  writeJson
};
