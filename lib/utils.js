var path = require('path');
var grunt = require('grunt');
var merge = require('merge');
var request = require('request');

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
  request(url, function(error, response, body) {
    callback(!error);
  });
}

module.exports = {
  joinPath: joinPath,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable
};

