const {
  enforceRuntimeNodeVersion,
  exitWithError,
  log,
  logError
} = require("./compat");

function exitWithSuccess(message) {
  if (message) logSuccess(message);
  process.exit(0);
}

function logInfo(...strings) {
  log("ℹ".blue, strings, "log");
}

function logSuccess(...strings) {
  log("✔".green, strings, "log");
}

function logWarn(...strings) {
  log("‼︎".yellow, strings, "warn");
}

module.exports = {
  enforceRuntimeNodeVersion,
  exitWithError,
  exitWithSuccess,
  logError,
  logInfo,
  logSuccess,
  logWarn
};
