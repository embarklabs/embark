let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
const {canonicalHost} = require('./host');

const balanceRegex = /([0-9]+) ?([a-zA-Z]*)/;

function joinPath() {
  const path = require('path');
  return path.join.apply(path.join, arguments);
}

function dirname() {
  const path = require('path');
  return path.dirname.apply(path.dirname, arguments);
}

function filesMatchingPattern(files) {
  const globule = require('globule');
  return globule.find(files, {nonull: true});
}

function fileMatchesPattern(patterns, intendedPath) {
  const globule = require('globule');
  return globule.isMatch(patterns, intendedPath);
}

function recursiveMerge(target, source) {
  const merge = require('merge');
  return merge.recursive(target, source);
}

function checkIsAvailable(url, callback) {
  http.get(url, function (_res) {
    callback(true);
  }).on('error', function (_res) {
    callback(false);
  });
}

function httpGetRequest(httpObj, url, callback) {
  httpObj.get(url, function (res) {
    let body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      callback(null, body);
    });
  }).on('error', function (err) {
    callback(err);
  });
}

function httpGet(url, callback) {
  httpGetRequest(http, url, callback);
}

function httpsGet(url, callback) {
  httpGetRequest(https, url, callback);
}

function httpGetJson(url, callback) {
  httpGetRequest(http, url, function (err, body) {
    try {
      let parsed = JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

function httpsGetJson(url, callback) {
  httpGetRequest(https, url, function (err, body) {
    try {
      let parsed = JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

function getJson(url, cb) {
  if (url.indexOf('https') === 0) {
    return httpsGetJson(url, cb);
  }
  httpGetJson(url, cb);
}

function pingEndpoint(host, port, type, protocol, origin, callback) {
  const options = {
    protocolVersion: 13,
    perMessageDeflate: true,
    origin: origin,
    host: host,
    port: port
  };
  if (type === 'ws') {
    options.headers = {
      'Sec-WebSocket-Version': 13,
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
      Origin: origin
    };
  }
  let req;
  // remove trailing api key from infura, ie rinkeby.infura.io/nmY8WtT4QfEwz2S7wTbl
  if (options.host.indexOf('/') > -1) {
    options.host = options.host.split('/')[0];
  }
  if (protocol === 'https') {
    req = require('https').get(options);
  } else {
    req = require('http').get(options);
  }

  req.on('error', (err) => {
    callback(err);
  });

  req.on('response', (_response) => {
    callback();
  });

  req.on('upgrade', (_res, _socket, _head) => {
    callback();
  });
}

function runCmd(cmd, options) {
  const shelljs = require('shelljs');
  let result = shelljs.exec(cmd, options || {silent: true});
  if (result.code !== 0) {
    console.log("error doing.. " + cmd);
    console.log(result.output);
    if (result.stderr !== undefined) {
      console.log(result.stderr);
    }
    exit();
  }
}

function cd(folder) {
  const shelljs = require('shelljs');
  shelljs.cd(folder);
}

function sed(file, pattern, replace) {
  const shelljs = require('shelljs');
  shelljs.sed('-i', pattern, replace, file);
}

function exit(code) {
  process.exit(code);
}

function downloadFile(url, dest, cb) {
  const o_fs = require('fs-extra');
  var file = o_fs.createWriteStream(dest);
  (url.substring(0, 5) === 'https' ? https : http).get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb);
    });
  }).on('error', function (err) {
    o_fs.unlink(dest);
    if (cb) cb(err.message);
  });
}

function extractTar(filename, packageDirectory, cb) {
  const o_fs = require('fs-extra');
  const tar = require('tar');
  o_fs.createReadStream(filename).pipe(
    tar.x({
      strip: 1,
      C: packageDirectory
    }).on('end', function () {
      cb();
    })
  );
}

function extractZip(filename, packageDirectory, opts, cb) {
  const decompress = require('decompress');

  decompress(filename, packageDirectory, opts).then((_files) => {
    cb();
  });
}

function proposeAlternative(word, _dictionary, _exceptions) {
  const propose = require('propose');
  let exceptions = _exceptions || [];
  let dictionary = _dictionary.filter((entry) => {
    return exceptions.indexOf(entry) < 0;
  });
  return propose(word, dictionary, {threshold: 0.3});
}

function pwd() {
  return process.env.PWD || process.cwd();
}

function getExternalContractUrl(file) {
  const constants = require('../constants');
  let url;
  const RAW_URL = 'https://raw.githubusercontent.com/';
  const MALFORMED_ERROR = 'Malformed Github URL for ';
  if (file.startsWith('https://github')) {
    const match = file.match(/https:\/\/github\.[a-z]+\/(.*)/);
    if (!match) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    url = `${RAW_URL}${match[1].replace('blob/', '')}`;
  } else if (file.startsWith('git')) {
    // Match values
    // [0] entire input
    // [1] git://
    // [2] user
    // [3] repository
    // [4] path
    // [5] branch
    const match = file.match(
      /(git:\/\/)?github\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~?\/&=]+)#?([a-zA-Z0-9\/_.-]*)?/
    );
    if (!match) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    let branch = match[5];
    if (!branch) {
      branch = 'master';
    }
    url = `${RAW_URL}${match[2]}/${match[3]}/${branch}/${match[4]}`;
  } else if (file.startsWith('http')) {
    url = file;
  } else {
    return null;
  }
  const match = url.match(
    /\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&\/=]+)/
  );
  return {
    url,
    filePath: constants.httpContractsDirectory + match[1]
  };
}

function hexToNumber(hex) {
  const Web3 = require('web3');
  return Web3.utils.hexToNumber(hex);
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

function isValidDomain(domain) {
  const isValidDomain = require('is-valid-domain');
  return isValidDomain(domain);
}

function isValidEthDomain(ethDomain) {
  if (!isValidDomain(ethDomain)) {
    return false;
  } else {
    return ethDomain.substring(ethDomain.lastIndexOf('.'), ethDomain.length) === '.eth';
  }
}

function decodeParams(typesArray, hexString) {
  var Web3EthAbi = require('web3-eth-abi');
  return Web3EthAbi.decodeParameters(typesArray, hexString);
}

function toChecksumAddress(address) {
  const Web3 = require('web3');
  return Web3.utils.toChecksumAddress(address);
}

function sha3(arg) {
  const Web3 = require('web3');
  return Web3.utils.sha3(arg);
}

function soliditySha3(arg) {
  const Web3 = require('web3');
  return Web3.utils.soliditySha3(arg);
}

function normalizeInput(input) {
  let args = Object.values(input);
  if (args.length === 0) {
    return "";
  }
  if (args.length === 1) {
    if (Array.isArray(args[0])) {
      return args[0].join(',');
    }
    return args[0] || "";
  }
  return ('[' + args.map((x) => {
    if (x === null) {
      return "null";
    }
    if (x === undefined) {
      return "undefined";
    }
    if (Array.isArray(x)) {
      return x.join(',');
    }
    return x;
  }).toString() + ']');
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
 * @returns {string} the constructued URL, with defaults
 */
function buildUrl(protocol, host, port) {
  if (!host) throw new Error('utils.buildUrl: parameter \'host\' is required');
  if (port) port = ':' + port;
  else port = '';
  return `${protocol || 'http'}://${host}${port}`;
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
  return this.buildUrl(configObj.protocol, canonicalHost(configObj.host), configObj.port);
}

function getWeiBalanceFromString(balanceString, web3){
  if(!web3){
    throw new Error(__('[utils.getWeiBalanceFromString]: Missing parameter \'web3\''));
  }
  if (!balanceString) {
    return 0;
  }
  const match = balanceString.match(balanceRegex);
  if (!match) {
    throw new Error(__('Unrecognized balance string "%s"', balanceString));
  }
  if (!match[2]) {
    return web3.utils.toHex(parseInt(match[1], 10));
  }

  return web3.utils.toWei(match[1], match[2]);
}

function getHexBalanceFromString(balanceString, web3) {
  if(!web3){
    throw new Error(__('[utils.getWeiBalanceFromString]: Missing parameter \'web3\''));
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
    return web3.utils.toHex(parseInt(match[1], 10));
  }

  return web3.utils.toHex(web3.utils.toWei(match[1], match[2]));
}

function compact(array) {
  return array.filter(n => n);
}

function groupBy(array, key) {
  return array.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function last(array) {
  return array[array.length - 1];
}

function interceptLogs(consoleContext, logger) {
  let context = {};
  context.console = consoleContext;

  context.console.log = function () {
    logger.info(normalizeInput(arguments));
  };
  context.console.warn = function () {
    logger.warn(normalizeInput(arguments));
  };
  context.console.info = function () {
    logger.info(normalizeInput(arguments));
  };
  context.console.debug = function () {
    // TODO: ue JSON.stringify
    logger.debug(normalizeInput(arguments));
  };
  context.console.trace = function () {
    logger.trace(normalizeInput(arguments));
  };
  context.console.dir = function () {
    logger.dir(normalizeInput(arguments));
  };
}

module.exports = {
  joinPath,
  dirname,
  filesMatchingPattern,
  fileMatchesPattern,
  recursiveMerge,
  checkIsAvailable,
  httpGet,
  httpsGet,
  httpGetJson,
  httpsGetJson,
  getJson,
  hexToNumber,
  isHex,
  hashTo32ByteHexString,
  isValidDomain,
  isValidEthDomain,
  pingEndpoint,
  decodeParams,
  runCmd,
  cd,
  sed,
  exit,
  downloadFile,
  extractTar,
  extractZip,
  proposeAlternative,
  pwd: pwd,
  getExternalContractUrl,
  toChecksumAddress,
  sha3,
  soliditySha3,
  normalizeInput,
  buildUrl,
  buildUrlFromConfig,
  getWeiBalanceFromString,
  getHexBalanceFromString,
  compact,
  groupBy,
  sample,
  last,
  interceptLogs
};
