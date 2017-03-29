/*global exit */
var path = require('path');
var globule = require('globule');
var merge = require('merge');
var http = require('http');
var shelljs = require('shelljs');
var _ = require('underscore')
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

function sed(file, pattern, replace) {
  shelljs.sed('-i', pattern, replace, file);
}

function exit(code) {
  process.exit(code);
}


// Helper for collection methods to determine whether a collection
// should be iterated as an array or as an object
// Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
// Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
var getLength = property('length');
var isArrayLike = function(collection) {
  var length = getLength(collection);
  return typeof length === 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
};

// Generator function to create the indexOf and lastIndexOf functions
function createIndexFinder(dir, predicateFind, sortedIndex) {
  return function(array, item, idx) {
    var i = 0, length = getLength(array);
    if (typeof idx === 'number') {
      if (dir > 0) {
        i = idx >= 0 ? idx : Math.max(idx + length, i);
      } else {
        length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
      }
    } else if (sortedIndex && idx && length) {
      idx = sortedIndex(array, item);
      return array[idx] === item ? idx : -1;
    }
    if (item !== item) {
      idx = predicateFind(slice.call(array, i, length), _.isNaN);
      return idx >= 0 ? idx + i : -1;
    }
    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
      if (array[idx] === item) return idx;
    }
    return -1;
  };
}

// Taken from underscore.js
function contains(obj, item, fromIndex, guard) {
  if (!isArrayLike(obj)) obj = _.values(obj);
  if (typeof fromIndex !== 'number' || guard) fromIndex = 0;
  this.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  return this.indexOf(obj, item, fromIndex) >= 0;
}

module.exports = {
  joinPath: joinPath,
  contains: contains,
  filesMatchingPattern: filesMatchingPattern,
  fileMatchesPattern: fileMatchesPattern,
  recursiveMerge: recursiveMerge,
  checkIsAvailable: checkIsAvailable,
  runCmd: runCmd,
  cd: cd,
  sed: sed,
  exit: exit
};

