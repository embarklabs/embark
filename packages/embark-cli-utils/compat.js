/* this script is written to be runnable with node >=0.10.0 */

require("colors");
var semver = require("semver");

function defaultRange() {
  return require("./package.json").runtime.engines.node;
}

function getPkgJson(pkgJsonPath) {
  var pkgJson;
  try {
    if (pkgJsonPath) pkgJson = require(pkgJsonPath);
  } finally {
    if (!pkgJson) pkgJson = {};
    // eslint-disable-next-line no-unsafe-finally
    return pkgJson;
  }
}

function getNodeVerRange(pkgJson) {
  var range;
  try {
    range = pkgJson.runtime.engines.node;
  } finally {
    if (!range) range = defaultRange();
    // eslint-disable-next-line no-unsafe-finally
    return range;
  }
}

function enforceRuntimeNodeVersion(pkgJsonPath) {
  var pkgJson = getPkgJson(pkgJsonPath);
  try {
    var procVer = semver.clean(process.version);
    var range = getNodeVerRange(pkgJson);
    if (!semver.satisfies(procVer, range)) {
      var pkgName = pkgNameCyan(pkgJson);
      var message = [
        pkgNameCyan(pkgJson),
        "node version ",
        procVer.red,
        " is not supported, version ",
        range.green,
        " is required",
        pkgName && " by " + pkgName
      ].join("");
      exitWithError(null, message);
    }
  } catch (e) {
    exitWithError(pkgJson, null, e);
  }
}

function exitWithError(pkgJson, message, err, silent) {
  var encountered = "encountered an error";
  if (pkgJson) logError(pkgNameCyan(pkgJson) + encountered);
  if (message) logError(message);
  if (err) console.error(err);
  if (!(pkgJson || message || err) && !silent) logError(encountered);
  process.exit(1);
}

function log(mark, strings, which) {
  var _which = which || "log";
  console[_which](
    mark,
    strings
      .filter(function(s) {
        return s;
      })
      .join(" ")
  );
}

function logError() {
  var strings = Array.prototype.slice.call(arguments);
  log("✘".red, strings, "error");
}

function pkgNameCyan(pkgJson) {
  return pkgJson.name ? pkgJson.name.cyan + " " : "";
}

module.exports = {
  defaultRange: defaultRange,
  enforceRuntimeNodeVersion: enforceRuntimeNodeVersion,
  exitWithError: exitWithError,
  log: log,
  logError: logError
};
