let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
import {canonicalHost, normalizeInput} from 'embark-utils';

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

function cd(folder) {
  const shelljs = require('shelljs');
  shelljs.cd(folder);
}

function sed(file, pattern, replace) {
  const shelljs = require('shelljs');
  shelljs.sed('-i', pattern, replace, file);
}

function downloadFile(url, dest, cb) {
  const o_fs = require('fs-extra');
  var file = o_fs.createWriteStream(dest);
  (url.substring(0, 5) === 'https' ? https : http).get(url, function (response) {
    if (response.statusCode !== 200) {
      cb(`Download failed, response code ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', function () {
      file.close(cb);
    });
  }).on('error', function (err) {
    o_fs.unlink(dest);
    cb(err.message);
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

function getExternalContractUrl(file,providerUrl) {
  const constants = require('embark-core/constants');
  let url;
  const RAW_URL = 'https://raw.githubusercontent.com/';
  const DEFAULT_SWARM_GATEWAY = 'https://swarm-gateways.net/';
  const MALFORMED_SWARM_ERROR = 'Malformed Swarm gateway URL for ';
  const MALFORMED_ERROR = 'Malformed Github URL for ';
  const MALFORMED_IPFS_ERROR = 'Malformed IPFS URL for ';
  const IPFS_GETURL_NOTAVAILABLE = 'IPFS getUrl is not available. Please set it in your storage config. For more info: https://embark.status.im/docs/storage_configuration.html';
  if (file.startsWith('https://github')) {
    const match = file.match(/https:\/\/github\.[a-z]+\/(.*)/);
    if (!match) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    url = `${RAW_URL}${match[1].replace('blob/', '')}`;
  } else if (file.startsWith('ipfs')) {
    if(!providerUrl) {
      console.error(IPFS_GETURL_NOTAVAILABLE);
      return null;
    }
    let match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)\/(.*)/);
    if(!match) {
      match = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)/);
      if(!match) {
        console.error(MALFORMED_IPFS_ERROR + file);
        return null;
      }
    }
    let matchResult = match[1];
    if(match[2]) {
      matchResult += '/' + match[2];
    }
    url = `${providerUrl}${matchResult}`;
    return {
      url,
      filePath: constants.httpContractsDirectory + matchResult
    };
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
  } else if(file.startsWith('bzz')){
    if(!providerUrl) {
      url = DEFAULT_SWARM_GATEWAY + file;
    } else {
      let match = file.match(/bzz:\/([-a-zA-Z0-9]+)\/(.*)/);
      if(!match){
        match = file.match(/bzz:\/([-a-zA-Z0-9]+)/);
        if(!match){
          console.log(MALFORMED_SWARM_ERROR + file);
          return null;
        }
      }
      url = providerUrl + '/' + file;
    }
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

function compact(array) {
  return array.filter(n => n);
}

function groupBy(array, key) {
  return array.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
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

function getWindowSize() {
  const windowSize = require('window-size');
  if (windowSize) {
    return windowSize.get();
  }

  return {width: 240, height: 75};
}

function isConstructor(obj) {
  return !!obj.prototype && !!obj.prototype.constructor.name;
}

function isEs6Module(module) {
  return (typeof module === 'function' && isConstructor(module)) || (typeof module === 'object' && typeof module.default === 'function' && module.__esModule);
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
  dirname,
  filesMatchingPattern,
  fileMatchesPattern,
  httpGet,
  httpsGet,
  httpGetJson,
  httpsGetJson,
  getJson,
  isValidDomain,
  pingEndpoint,
  cd,
  sed,
  downloadFile,
  extractTar,
  extractZip,
  getExternalContractUrl,
  normalizeInput,
  buildUrl,
  buildUrlFromConfig,
  compact,
  groupBy,
  interceptLogs,
  errorMessage,
  fileTreeSort,
  getWindowSize,
  isEs6Module,
  urlJoin
};
