const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const shelljs = require('shelljs');

const {canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker} = require('./host');
const {findNextPort} = require('./network');
const logUtils = require('./log-utils');

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

function recursiveMerge(target, source) {
  const merge = require('merge');
  return merge.recursive(target, source);
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


const Utils = {
  joinPath: function() {
    const path = require('path');
    return path.join.apply(path.join, arguments);
  },
  canonicalHost,
  defaultCorsHost,
  defaultHost,
  dockerHostSwap,
  exit,
  isDocker,
  checkIsAvailable,
  findNextPort,
  hashTo32ByteHexString,
  isHex,
  soliditySha3,
  recursiveMerge,
  sha512,
  runCmd,
  escapeHtml: logUtils.escapeHtml,
  normalizeInput: logUtils.normalizeInput,
  LogHandler: require('./logHandler'),
  AddressUtils: require('./addressUtils')
};

module.exports = Utils;
