let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
import {normalizeInput} from 'embark-utils';

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

function cd(folder) {
  const shelljs = require('shelljs');
  shelljs.cd(folder);
}

function sed(file, pattern, replace) {
  const shelljs = require('shelljs');
  shelljs.sed('-i', pattern, replace, file);
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
  cd,
  sed,
  extractTar,
  extractZip,
  normalizeInput,
  interceptLogs,
  getWindowSize,
  isEs6Module
};
