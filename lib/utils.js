var path = require('path');
var grunt = require('grunt');

function joinPath() {
  return path.join.apply(path.join, arguments);
}

function filesMatchinPattern(files) {
  return grunt.file.expand({nonull: true}, files);
}

function fileMatchesPattern(patterns, intendedPath) {
  return grunt.file.isMatch(patterns, intendedPath);
}

module.exports = {
  joinPath: joinPath
};

