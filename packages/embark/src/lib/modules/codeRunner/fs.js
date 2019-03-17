/* global module process require */

const {DAPP_PATH,
       DIAGRAM_PATH,
       EMBARK_PATH,
       PKG_PATH,
       anchoredValue} = require('../../core/env');
const fs = require('fs-extra');
const os = require('os');
const parseJson = require('parse-json');
const path = require('path');
const utils = require('../../utils/utils');
require('colors');

function restrictPath(receiver, binding, count, args) {
  const dapp = dappPath();
  let embark = embarkPath();
  const pkg = pkgPath();

  // In the monorepo, enable doing FS functions on all of embark (needed to access embark/node_modules)
  embark = embark.replace(path.normalize('embark/packages/'), '');

  const allowedRoots = [
    dapp,
    embark,
    pkg,
    os.tmpdir()
  ];

  let allInsideRestricted = true;

  for (let i = 0; i < count; i++) {
    const resolved = path.resolve(dapp, args[i]);
    allInsideRestricted = allowedRoots.some(p => { return resolved.indexOf(p) === 0; });
    if (!allInsideRestricted) break;
  }

  if (allInsideRestricted) return receiver.apply(binding, args);
  throw new Error('EPERM: Operation not permitted');
}

function mkdirpSync(...args) { return restrictPath(fs.mkdirpSync, fs, 1, args); }

function mkdirp(...args) { return restrictPath(fs.mkdirp, fs, 1, args); }

function readdir(...args) { return restrictPath(fs.readdir, fs, 1, args); }

function stat(...args) { return restrictPath(fs.stat, fs, 1, args); }

function remove(...args) { return restrictPath(fs.remove, fs, 1, args); }

function copy(...args) { return restrictPath(fs.copy, fs, 2, args); }

function copySync(...args) { return restrictPath(fs.copySync, fs, 2, args); }

function move(...args) { return restrictPath(fs.move, fs, 2, args); }

function moveSync(...args) { return restrictPath(fs.moveSync, fs, 2, args); }

function symlink(...args) { return restrictPath(fs.symlink, fs, 2, args); }

function appendFileSync(...args) { return restrictPath(fs.appendFileSync, fs, 1, args); }

function writeFile(...args) { return restrictPath(fs.writeFile, fs, 1, args); }

function writeFileSync(...args) { return restrictPath(fs.writeFileSync, fs, 1, args); }

function readFile(...args) { return restrictPath(fs.readFile, fs, 1, args); }

function readFileSync(...args) { return restrictPath(fs.readFileSync, fs, 1, args); }

function readdirSync(...args) { return restrictPath(fs.readdirSync, fs, 1, args); }

function statSync(...args) { return restrictPath(fs.statSync, fs, 1, args); }

function readJSONSync(...args) {
  const content = readFileSync(...args);
  let json;
  try {
    json = parseJson(content);
  } catch(e) {
    console.error('error: '.red + args[0].green.underline + ' ' + e.message.green);
    process.exit(0);
  }
  return json;
}

function writeJSONSync(...args) { return restrictPath(fs.writeJSONSync, fs, 1, args); }

function outputJSONSync(...args) { return restrictPath(fs.outputJSONSync, fs, 1, args); }

function writeJson(...args) { return restrictPath(fs.writeJson, fs, 1, args); }

function existsSync(...args) { return restrictPath(fs.existsSync, fs, 1, args); }

function ensureFileSync(...args) { return restrictPath(fs.ensureFileSync, fs, 1, args); }

function ensureDirSync(...args) { return restrictPath(fs.ensureDirSync, fs, 1, args); }

function access(...args) { return restrictPath(fs.access, fs, 1, args); }

function removeSync(...args) { return restrictPath(fs.removeSync, fs, 1, args); }

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

function createWriteStream(...args) { return restrictPath(fs.createWriteStream, fs, 1, args); }

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

  return restrictPath(implementation, {}, 2, [sourceFilePath, targetFilePath]);
}

function outputFileSync(...args) { return restrictPath(fs.outputFileSync, fs, 1, args); }

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
