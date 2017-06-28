/*global exit */
let path = require('path');
let globule = require('globule');
let merge = require('merge');
let http = require('http');
let shelljs = require('shelljs');

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
  http.get(url, function (res) {
    callback(true);
  }).on('error', function (res) {
    callback(false);
  });
}

function httpGet(url, callback) {
  return http.get(url, callback);
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

//TODO: Maybe desired to just `module.exports = this` ?
module.exports = {
  joinPath: joinPath,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable,
  httpGet: httpGet,
  runCmd: runCmd,
  cd: cd,
  sed: sed,
  exit: exit
};

