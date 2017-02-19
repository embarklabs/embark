/*global exit */
var path = require('path');
var grunt = require('grunt');
var merge = require('merge');
var http = require('http');
var shelljs = require('shelljs');

function joinPath() {
  return path.join.apply(path.join, arguments);
}

function filesMatchingPattern(files) {
  return grunt.file.expand({nonull: true}, files);
}

function fileMatchesPattern(patterns, intendedPath) {
  return grunt.file.isMatch(patterns, intendedPath);
}

function recursiveMerge(target, source) {
  return merge.recursive(target, source);
}

function checkIsAvailable(url, callback) {
  http.get(url, function(res) {
    callback(true);
  }).on('error', function(res) {
    callback(false);
  });
}

function runCmd(cmd, options) {
  var result = shelljs.exec(cmd, options || {silent: true});
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

function exit(code) {
  process.exit(code);
}

module.exports = {
  joinPath: joinPath,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable,
  runCmd: runCmd,
  cd: cd,
  exit: exit
};

