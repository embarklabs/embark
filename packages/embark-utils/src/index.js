const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const shelljs = require('shelljs');
const clipboardy = require('clipboardy');

const {canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker} = require('./host');
const {findNextPort} = require('./network');
const logUtils = require('./log-utils');
const toposortGraph = require('./toposort');
import { unitRegex, balanceRegex } from './constants';
import * as AddressUtils from './addressUtils';
const web3 = require("web3");

const { extendZeroAddressShorthand, replaceZeroAddressShorthand } = AddressUtils;

import { last, recursiveMerge } from './collections';

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

function isHex(hex) {
  const Web3 = require('web3');
  return Web3.utils.isHex(hex);
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

function soliditySha3(arg) {
  const Web3 = require('web3');
  return Web3.utils.soliditySha3(arg);
}

function sha512(arg) {
  if (typeof arg !== 'string') {
    throw new TypeError('argument must be a string');
  }
  const crypto = require('crypto');
  const hash = crypto.createHash('sha512');
  return hash.update(arg).digest('hex');
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

function getHexBalanceFromString(balanceString, web3) {
  if(!web3){
    throw new Error(__('[getHexBalanceFromString]: Missing parameter \'web3\''));
  }
  if (!balanceString) {
    return 0xFFFFFFFFFFFFFFFFFF;
  }
  if (web3.utils.isHexStrict(balanceString)) {
    return balanceString;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__('Unrecognized balance string "%s"', balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(match[1]);
  }

  return web3.utils.toHex(web3.utils.toWei(match[1], match[2]));
}

function getWeiBalanceFromString(balanceString, web3){
  if(!web3){
    throw new Error(__('[getWeiBalanceFromString]: Missing parameter \'web3\''));
  }
  if (!balanceString) {
    return 0;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__('Unrecognized balance string "%s"', balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(match[1]);
  }

  return web3.utils.toWei(match[1], match[2]);
}

function prepareContractsConfig(config) {
  Object.keys(config.contracts).forEach((contractName) => {
    const gas = config.contracts[contractName].gas;
    const gasPrice = config.contracts[contractName].gasPrice;
    const address = config.contracts[contractName].address;
    const args = config.contracts[contractName].args;
    const onDeploy = config.contracts[contractName].onDeploy;

    if (gas && gas.toString().match(unitRegex)) {
      config.contracts[contractName].gas = getWeiBalanceFromString(gas, web3);
    }

    if (gasPrice && gasPrice.toString().match(unitRegex)) {
      config.contracts[contractName].gasPrice = getWeiBalanceFromString(gasPrice, web3);
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


const Utils = {
  joinPath: function() {
    const path = require('path');
    return path.join.apply(path.join, arguments);
  },
  canonicalHost,
  copyToClipboard,
  deconstructUrl,
  defaultCorsHost,
  defaultHost,
  dockerHostSwap,
  exit,
  isDocker,
  checkIsAvailable,
  findNextPort,
  hashTo32ByteHexString,
  isHex,
  last,
  soliditySha3,
  recursiveMerge,
  prepareContractsConfig,
  getWeiBalanceFromString,
  getHexBalanceFromString,
  sha512,
  timer,
  unitRegex,
  runCmd,
  escapeHtml: logUtils.escapeHtml,
  normalizeInput: logUtils.normalizeInput,
  LogHandler: require('./logHandler'),
  proposeAlternative,
  toposort,
  AddressUtils
};

module.exports = Utils;
