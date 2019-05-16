/* this script is written to be runnable with node >=0.10.0 */

var semver = require("semver");

var constants = require("./constants");
var encountered = constants.encountered;
var errorLogger = constants.errorLogger;
var errorMark = constants.errorMark;

exports.getPkgJson = function(pkgJsonPath) {
  var pkgJson;
  try {
    if (pkgJsonPath) pkgJson = require(pkgJsonPath);
  } finally {
    if (!pkgJson) pkgJson = {};
    // eslint-disable-next-line no-unsafe-finally
    return pkgJson;
  }
};

exports.defaultRange = function() {
  return exports.getPkgJson("./package.json").runtime.engines.node;
};

exports.getNodeVerRange = function(pkgJson) {
  var range;
  try {
    range = pkgJson.runtime.engines.node;
  } finally {
    if (!range) range = exports.defaultRange();
    // eslint-disable-next-line no-unsafe-finally
    return range;
  }
};

exports.log = function(mark, strings, which) {
  var _which = which || "log";
  console[_which](
    mark,
    strings
      .filter(function(s) {
        return s;
      })
      .join(" ")
  );
};

exports.logError = function() {
  var strings = Array.prototype.slice.call(arguments);
  exports.log(errorMark, strings, errorLogger);
};

exports.pkgNameCyan = function(pkgJson) {
  return pkgJson.name ? pkgJson.name.cyan : "";
};

exports.exitWithError = function(pkgJson, message, err, silent) {
  if (pkgJson) {
    exports.logError(exports.pkgNameCyan(pkgJson) + " " + encountered);
  }
  if (message) exports.logError(message);
  if (err) console.error(err);
  if (!(pkgJson || message || err) && !silent) exports.logError(encountered);
  process.exit(1);
};

exports.enforceRuntimeNodeVersion = function(pkgJsonPath) {
  var pkgJson = exports.getPkgJson(pkgJsonPath);
  try {
    var procVer = semver.clean(process.version);
    var range = exports.getNodeVerRange(pkgJson);
    if (!semver.satisfies(procVer, range)) {
      var pkgName = exports.pkgNameCyan(pkgJson);
      var message = [
        "node version ",
        procVer.red,
        " is not supported, version ",
        range.green,
        " is required",
        pkgName && " by " + exports.pkgNameCyan(pkgJson)
      ].join("");
      exports.exitWithError(null, message);
    }
  } catch (e) {
    exports.exitWithError(pkgJson, null, e);
  }
};
