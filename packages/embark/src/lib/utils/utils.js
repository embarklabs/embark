let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
let toposortGraph = require('./toposort.js');
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
  const protocol = url.split(':')[0];
  const httpObj = (protocol === 'https') ? https : http;

  httpObj.get(url, function (_res) {
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
      let parsed = body && JSON.parse(body);
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
  // remove any extra information from a host string, e.g. port, path, query
  const _host = require('url').parse(
    // url.parse() expects a protocol segment else it won't parse as desired
    host.slice(0, 4) === 'http' ? host : `${protocol}://${host}`
  ).hostname;

  let closed = false;
  const close = (req, closeMethod) => {
    if (!closed) {
      closed = true;
      req[closeMethod]();
    }
  };

  const handleEvent = (req, closeMethod, ...args) => {
    close(req, closeMethod);
    setImmediate(() => { callback(...args); });
  };

  const handleError = (req, closeMethod) => {
    req.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error(
          `Ping: Network error` +
            (err.message ? ` '${err.message}'` : '') +
            (err.code ? ` (code: ${err.code})` : '')
        );
      }
      // when closed additional error events will not callback
      if (!closed) { handleEvent(req, closeMethod, err); }
    });
  };

  const handleSuccess = (req, closeMethod, event) => {
    req.once(event, () => {
      handleEvent(req, closeMethod);
    });
  };

  const handleRequest = (req, closeMethod, event) => {
    handleError(req, closeMethod);
    handleSuccess(req, closeMethod, event);
  };

  if (type === 'ws') {
    const url = `${protocol === 'https' ? 'wss' : 'ws'}://${_host}:${port}/`;
    const req = new (require('ws'))(url, origin ? {origin} : {});
    handleRequest(req, 'close', 'open');
  } else {
    const headers = origin ? {Origin: origin} : {};
    const req = (protocol === 'https' ? require('https') : require('http')).get(
      {headers, host: _host, port}
    );
    handleRequest(req, 'abort', 'response');
  }
}

function runCmd(cmd, options, callback) {
  const shelljs = require('shelljs');
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

function isValidDomain(v) {
  // from: https://github.com/miguelmota/is-valid-domain
  if (typeof v !== 'string') return false;

  var parts = v.split('.');
  if (parts.length <= 1) return false;

  var tld = parts.pop();
  var tldRegex = /^(?:xn--)?[a-zA-Z0-9]+$/gi;

  if (!tldRegex.test(tld)) return false;

  var isValid = parts.every(function(host) {
    var hostRegex = /^(?!:\/\/)([a-zA-Z0-9]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])$/gi;

    return hostRegex.test(host);
  });

  return isValid;
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
  if(typeof input === 'string') return input;
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
  return this.buildUrl(configObj.protocol, canonicalHost(configObj.host), configObj.port, configObj.type);
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
    return web3.utils.toHex(match[1]);
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
    return web3.utils.toHex(match[1]);
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

function errorMessage(e) {
  if (typeof e === 'string') {
    return e;
  } else if (e && e.message) {
    return e.message;
  }
  return e;
}

function timer(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isFolder(node) {
  return node.children && node.children.length;
}

function isNotFolder(node){
  return !isFolder(node);
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function fileTreeSort(nodes){
  const folders = nodes.filter(isFolder).sort(byName);
  const files = nodes.filter(isNotFolder).sort(byName);

  return folders.concat(files);
}

function copyToClipboard(text) {
  const clipboardy = require('clipboardy');
  clipboardy.writeSync(text);
}

function fuzzySearch(text, list, filter) {
  const fuzzy = require('fuzzy');
  return fuzzy.filter(text, list, {extract: (filter || function () {})});
}

function jsonFunctionReplacer(_key, value) {
  if (typeof value === 'function') {
    return value.toString();
  }

  return value;
}

function getWindowSize() {
  const windowSize = require('window-size');
  return windowSize.get();
}

function toposort(graph) {
  return toposortGraph(graph);
}

function isEs6Module(module) {
  return typeof module === 'object' && typeof module.default === 'function' && module.__esModule;
}

function urlJoin(url, path) {
  let urlChunks = url.split('/');
  let levels = path.split('../');

  // remove relative path parts from end of url
  urlChunks = urlChunks.slice(0, urlChunks.length - levels.length);

  // remove relative path parts from start of match
  levels.splice(0, levels.length - 1);

  // add on our match so we can join later
  urlChunks = urlChunks.concat(levels.join().replace('./', ''));

  return urlChunks.join('/');
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
  pingEndpoint,
  decodeParams,
  runCmd,
  cd,
  sed,
  exit,
  extractTar,
  extractZip,
  proposeAlternative,
  toChecksumAddress,
  sha3,
  soliditySha3,
  normalizeInput,
  buildUrl,
  buildUrlFromConfig,
  deconstructUrl,
  getWeiBalanceFromString,
  getHexBalanceFromString,
  compact,
  groupBy,
  sample,
  last,
  interceptLogs,
  errorMessage,
  timer,
  fileTreeSort,
  copyToClipboard,
  fuzzySearch,
  jsonFunctionReplacer,
  getWindowSize,
  toposort,
  isEs6Module,
  urlJoin
};
