/* global __dirname module process require */

const {delimiter} = require('path');
const {joinPath} = require('../utils/utils.js');

function anchoredValue(anchor, value) {
  if (!arguments.length) {
    throw new TypeError('anchor name was not specified');
  }
  if (arguments.length > 2) {
    throw new TypeError('accepts at most 2 arguments');
  }
  if (typeof anchor !== 'string') {
    throw new TypeError('anchor name was not a string');
  }
  let _anchor = process.env[anchor];
  if (arguments.length < 2 && !_anchor) {
    throw new Error(`process.env.${anchor} was not set`);
  }
  // don't override an existing value, e.g. if already set by bin/embark
  if (!_anchor) {
    _anchor = value;
    process.env[anchor] = _anchor;
  }
  return _anchor;
}

const PWD = 'PWD';
const DEFAULT_PWD = process.cwd();
anchoredValue(PWD, DEFAULT_PWD);

const DAPP_PATH = 'DAPP_PATH';
const DEFAULT_DAPP_PATH = anchoredValue(PWD);
anchoredValue(DAPP_PATH, DEFAULT_DAPP_PATH);

const CMD_HISTORY_SIZE = 'CMD_HISTORY_SIZE';
const DEFAULT_CMD_HISTORY_SIZE = 20;
anchoredValue(CMD_HISTORY_SIZE, DEFAULT_CMD_HISTORY_SIZE);

const DIAGRAM_PATH = 'DIAGRAM_PATH';
const DEFAULT_DIAGRAM_PATH = joinPath(anchoredValue(DAPP_PATH), 'diagram.svg');
anchoredValue(DIAGRAM_PATH, DEFAULT_DIAGRAM_PATH);

const EMBARK_PATH = 'EMBARK_PATH';
const DEFAULT_EMBARK_PATH = joinPath(__dirname, '../../..');
anchoredValue(EMBARK_PATH, DEFAULT_EMBARK_PATH);

const PKG_PATH = 'PKG_PATH';
const DEFAULT_PKG_PATH = anchoredValue(PWD);
anchoredValue(PKG_PATH, DEFAULT_PKG_PATH);

const NODE_PATH = 'NODE_PATH';
// NOTE: setting NODE_PATH at runtime won't effect lookup behavior in the
// current process, but will take effect in child processes
process.env[NODE_PATH] = joinPath(anchoredValue(EMBARK_PATH), 'node_modules') +
  (process.env[NODE_PATH] ? delimiter : '') +
  (process.env[NODE_PATH] || '');

module.exports = {
  anchoredValue,
  PWD,
  DAPP_PATH,
  CMD_HISTORY_SIZE,
  DIAGRAM_PATH,
  EMBARK_PATH,
  PKG_PATH
};
