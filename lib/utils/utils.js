let path = require('path');
let globule = require('globule');
let merge = require('merge');
let http = require('follow-redirects').http;
let https = require('follow-redirects').https;
let shelljs = require('shelljs');

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

function httpGet(url, callback) {
  return http.get(url, callback);
}

function httpsGet(url, callback) {
  https.get(url, function(res) {
    let body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      callback(body);
    });
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

module.exports = {
  joinPath: joinPath,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable,
  httpGet: httpGet,
  httpsGet: httpsGet,
  runCmd: runCmd,
  cd: cd,
  sed: sed,
  exit: exit,
  downloadFile: downloadFile
};
