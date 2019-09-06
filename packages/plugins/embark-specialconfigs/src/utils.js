
function createLogWithPrefixFn(logger, method, prefix) {
  return function () {
    const args = Array.from(arguments).map(arg => `${prefix} ${arg}`);
    args.forEach(arg => logger[method](arg));
  };
}

const Utils = {
  createLoggerWithPrefix(embarkLogger, prefix) {
    const logger = {
      log: createLogWithPrefixFn(embarkLogger, 'log', prefix),
      warn: createLogWithPrefixFn(embarkLogger, 'warn', prefix),
      error: createLogWithPrefixFn(embarkLogger, 'error', prefix),
      info: createLogWithPrefixFn(embarkLogger, 'info', prefix),
      dir: createLogWithPrefixFn(embarkLogger, 'dir', prefix),
      debug: createLogWithPrefixFn(embarkLogger, 'debug', prefix)
    };
    return logger;
  }
};

module.exports = Utils;
