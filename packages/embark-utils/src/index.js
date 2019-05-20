const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const shelljs = require('shelljs');
const clipboardy = require('clipboardy');

const {canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker} = require('./host');
const { findNextPort, downloadFile } = require('./network');
const logUtils = require('./log-utils');
const toposortGraph = require('./toposort');
import { unitRegex } from './constants';
import * as AddressUtils from './addressUtils';
import {
  getWeiBalanceFromString,
  getHexBalanceFromString,
  hexToNumber,
  decodeParams,
  sha3,
  sha512,
  isHex,
  soliditySha3,
  toChecksumAddress
} from './web3Utils';
import { getAddressToContract, getTransactionParams } from './transactionUtils';
import LongRunningProcessTimer from './longRunningProcessTimer';
import AccountParser from './accountParser';
import { dappPath, embarkPath, ipcPath, joinPath, tmpDir, urlJoin } from './pathUtils';

const { extendZeroAddressShorthand, replaceZeroAddressShorthand } = AddressUtils;

import { compact, last, recursiveMerge, groupBy } from './collections';
import { prepareForCompilation } from './solidity/remapImports';
import { removePureView } from './solidity/code';
import { File, getExternalContractUrl, Types } from './file';

function timer(ms) {
  const then = Date.now();
  return new Promise(resolve => (
    setTimeout(() => resolve(Date.now() - then), ms)
  ));
}

function checkIsAvailable(url, callback) {
  const protocol = url.split(':')[0];
  const httpObj = (protocol === 'https') ? https : http;

  httpObj.get(url, function (_res) {
    callback(true);
  }).on('error', function (_res) {
    callback(false);
  });
}

function hashTo32ByteHexString(hash) {
  if (isHex(hash)) {
    if (!hash.startsWith('0x')) {
      hash = '0x' + hash;
    }
    return hash;
  }
  const multihash = require('multihashes');
  let buf = multihash.fromB58String(hash);
  let digest = multihash.decode(buf).digest;
  return '0x' + multihash.toHexString(digest);
}

function exit(code) {
  process.exit(code);
}

function runCmd(cmd, options, callback) {
  options = Object.assign({silent: true, exitOnError: true, async: true}, options || {});
  const outputToConsole = !options.silent;
  options.silent = true;
  let result = shelljs.exec(cmd, options, function (code, stdout) {
    if(code !== 0) {
      if (options.exitOnError) {
        return exit();
      }
      if(typeof callback === 'function') {
        callback(`shell returned code ${code}`);
      }
    } else {
      if(typeof callback === 'function') {
        return callback(null, stdout);
      }
    }
  });

  result.stdout.on('data', function(data) {
    if(outputToConsole) {
      console.log(data);
    }
  });

  result.stderr.on('data', function(data) {
    if (outputToConsole) {
      console.log(data);
    }
  });
}

function copyToClipboard(text) {
  clipboardy.writeSync(text);
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function isFolder(node) {
  return node.children && node.children.length;
}

function isNotFolder(node){
  return !isFolder(node);
}

function fileTreeSort(nodes){
  const folders = nodes.filter(isFolder).sort(byName);
  const files = nodes.filter(isNotFolder).sort(byName);

  return folders.concat(files);
}

function proposeAlternative(word, _dictionary, _exceptions) {
  const propose = require('propose');
  let exceptions = _exceptions || [];
  let dictionary = _dictionary.filter((entry) => {
    return exceptions.indexOf(entry) < 0;
  });
  return propose(word, dictionary, {threshold: 0.3});
}

function toposort(graph) {
  return toposortGraph(graph);
}

function deconstructUrl(endpoint) {
  const matches = endpoint.match(/(ws|https?):\/\/([a-zA-Z0-9_.-]*):?([0-9]*)?/);
  return {
    protocol: matches[1],
    host: matches[2],
    port: matches[3],
    type: matches[1] === 'ws' ? 'ws' : 'rpc'
  };
}

function prepareContractsConfig(config) {
  Object.keys(config.contracts).forEach((contractName) => {
    const gas = config.contracts[contractName].gas;
    const gasPrice = config.contracts[contractName].gasPrice;
    const address = config.contracts[contractName].address;
    const args = config.contracts[contractName].args;
    const onDeploy = config.contracts[contractName].onDeploy;

    if (gas && gas.toString().match(unitRegex)) {
      config.contracts[contractName].gas = getWeiBalanceFromString(gas);
    }

    if (gasPrice && gasPrice.toString().match(unitRegex)) {
      config.contracts[contractName].gasPrice = getWeiBalanceFromString(gasPrice);
    }

    if (address) {
      config.contracts[contractName].address = extendZeroAddressShorthand(address);
    }

    if (args && args.length) {
      config.contracts[contractName].args = args.map((val) => {
        if (typeof val === "string") {
          return extendZeroAddressShorthand(val);
        }
        return val;
      });
    }

    if (Array.isArray(onDeploy)) {
      config.contracts[contractName].onDeploy = onDeploy.map(replaceZeroAddressShorthand);
    }
  });

  return config;
}

function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }

  return value;
}

function fuzzySearch(text, list, filter) {
  const fuzzy = require('fuzzy');
  return fuzzy.filter(text, list, {extract: (filter || function () {})});
}

/**
 * Builds a URL
 *
 * @param {string} protocol
 *  The URL protocol, defaults to http.
 * @param {string} host
 *  The URL host, required.
 * @param {string} port
 *  The URL port, default to empty string.
 * @param {string} [type]
 *  Type of connection
 * @returns {string} the constructued URL, with defaults
 */
function buildUrl(protocol, host, port, type) {
  if (!host) throw new Error('utils.buildUrl: parameter \'host\' is required');
  if (port) port = ':' + port;
  else port = '';
  if (!protocol) {
    protocol = type === 'ws' ? 'ws' : 'http';
  }
  return `${protocol}://${host}${port}`;
}

/**
 * Builds a URL
 *
 * @param {object} configObj Object containing protocol, host, and port to be used to construct the url.
 *      * protocol      {String}    (optional) The URL protocol, defaults to http.
 *      * host          {String}    (required) The URL host.
 *      * port          {String}    (optional) The URL port, default to empty string.
 * @returns {string} the constructued URL, with defaults
 */
function buildUrlFromConfig(configObj) {
  if (!configObj) throw new Error('[utils.buildUrlFromConfig]: config object must cannot be null');
  if (!configObj.host) throw new Error('[utils.buildUrlFromConfig]: object must contain a \'host\' property');
  return buildUrl(configObj.protocol, canonicalHost(configObj.host), configObj.port, configObj.type);
}

function errorMessage(e) {
  if (typeof e === 'string') {
    return e;
  } else if (e && e.message) {
    return e.message;
  }
  return e;
}


const Utils = {
  buildUrl,
  buildUrlFromConfig,
  joinPath,
  tmpDir,
  ipcPath,
  dappPath,
  downloadFile,
  embarkPath,
  jsonFunctionReplacer,
  fuzzySearch,
  canonicalHost,
  compact,
  copyToClipboard,
  deconstructUrl,
  defaultCorsHost,
  defaultHost,
  decodeParams,
  dockerHostSwap,
  exit,
  errorMessage,
  getAddressToContract,
  getTransactionParams,
  isDocker,
  checkIsAvailable,
  File,
  findNextPort,
  fileTreeSort,
  hashTo32ByteHexString,
  hexToNumber,
  isHex,
  last,
  soliditySha3,
  recursiveMerge,
  prepareContractsConfig,
  getWeiBalanceFromString,
  getHexBalanceFromString,
  getExternalContractUrl,
  groupBy,
  sha512,
  sha3,
  timer,
  Types,
  unitRegex,
  urlJoin,
  removePureView,
  runCmd,
  escapeHtml: logUtils.escapeHtml,
  normalizeInput: logUtils.normalizeInput,
  LogHandler: require('./logHandler'),
  LongRunningProcessTimer,
  prepareForCompilation,
  proposeAlternative,
  toChecksumAddress,
  toposort,
  AddressUtils,
  AccountParser
};

module.exports = Utils;
