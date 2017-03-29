/*global exit */
var path = require('path');
var globule = require('globule');
var merge = require('merge');
var http = require('http');
var shelljs = require('shelljs');

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'].forEach(function(name) {
  this['is' + name] = function(obj) {
    return toString.call(obj) === '[object ' + name + ']';
  };
});

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

function isNotANumber(obj) {
  return this.isNumber(obj) && obj !== +obj;
}

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
    if (!(item === item)) {
      idx = predicateFind(slice.call(array, i, length), isNotANumber);
      return idx >= 0 ? idx + i : -1;
    }
    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
      if (array[idx] === item) return idx;
    }
    return -1;
  };
}

// Generator function to create the findIndex and findLastIndex functions
function createPredicateIndexFinder(dir) {
  return function(array, predicate, context) {
    predicate = cb(predicate, context);
    var length = getLength(array);
    var index = dir > 0 ? 0 : length - 1;
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index], index, array)) return index;
    }
    return -1;
  };
}

function values(obj) {
  var keys = Object.keys(obj);
  var length = keys.length;
  var values = new Array(length);
  for (var i = 0; i < length; i++) {
    values[i] = obj[keys[i]];
  }
  return values;
}

function sortedIndex(array, obj, iteratee, context) {
  iteratee = cb(iteratee, context, 1);
  var value = iteratee(obj);
  var low = 0, high = getLength(array);
  while (low < high) {
    var mid = Math.floor((low + high) / 2);
    if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
  }
  return low;
}

// Taken from underscore.js
function contains(obj, item, fromIndex, guard) {
  if (!isArrayLike(obj)) obj = values(obj);
  if (typeof fromIndex !== 'number' || guard) fromIndex = 0;
  this.findIndex = createPredicateIndexFinder(1);
  this.indexOf = createIndexFinder(1, this.findIndex, sortedIndex);
  return this.indexOf(obj, item, fromIndex) >= 0;
}

module.exports = this;

