let path = require('path');
let globule = require('globule');
let merge = require('merge');
let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
let shelljs = require('shelljs');
var tar = require('tar');
var propose = require('propose');
const constants = require('../constants');

//let fs = require('../core/fs.js');
let o_fs = require('fs-extra');

function joinPath() {
  return path.join.apply(path.join, arguments);
}

function filesMatchingPattern(files) {
  return globule.find(files, {nonull: true});
}

function fileMatchesPattern(patterns, intendedPath) {
  return globule.isMatch(patterns, intendedPath);
}

function recursiveMerge(target, source) {
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
  httpObj.get(url, function(res) {
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
  httpGetRequest(http, url, function(err, body) {
    try {
      let parsed = JSON.parse(body);
      return callback(err, parsed);
    } catch(e) {
      return callback(e);
    }
  });
}

function runCmd(cmd, options) {
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
  shelljs.cd(folder);
}

function sed(file, pattern, replace) {
  shelljs.sed('-i', pattern, replace, file);
}

function exit(code) {
  process.exit(code);
}

function downloadFile(url, dest, cb) {
  var file = o_fs.createWriteStream(dest);
  (url.substring(0,5) === 'https' ? https : http).get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
    });
  }).on('error', function(err) {
    o_fs.unlink(dest);
    if (cb) cb(err.message);
  });
}

function extractTar(filename, packageDirectory, cb) {
  o_fs.createReadStream(filename).pipe(
    tar.x({
      strip: 1,
      C: packageDirectory
    }).on('end', function() {
      cb();
    })
  );
}

function proposeAlternative(word, _dictionary, _exceptions) {
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
      /(git:\/\/)?github\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~?\/&=]+)#?([a-zA-Z0-1\/_.-]*)?/
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

module.exports = {
  joinPath: joinPath,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable,
  httpGet: httpGet,
  httpsGet: httpsGet,
  httpGetJson: httpGetJson,
  runCmd: runCmd,
  cd: cd,
  sed: sed,
  exit: exit,
  downloadFile: downloadFile,
  extractTar: extractTar,
  proposeAlternative: proposeAlternative,
  pwd: pwd,
  getExternalContractUrl
};
