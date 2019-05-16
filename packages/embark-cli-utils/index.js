const {
  enforceRuntimeNodeVersion,
  exitWithError,
  log,
  logError
} = require("./compat");

const {
  logLogger,
  warnLogger,
  infoMark,
  successMark,
  warnMark
} = require("./constants");

exports.enforceRuntimeNodeVersion = enforceRuntimeNodeVersion;
exports.exitWithError = exitWithError;
exports.logError = logError;

exports.logInfo = function(...strings) {
  log(infoMark, strings, logLogger);
};

exports.logSuccess = function(...strings) {
  log(successMark, strings, logLogger);
};

exports.logWarn = function(...strings) {
  log(warnMark, strings, warnLogger);
};

exports.exitWithSuccess = function(message) {
  if (message) exports.logSuccess(message);
  process.exit(0);
};
