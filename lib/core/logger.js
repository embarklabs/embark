let colors = require('colors');

class Logger {
  constructor(options) {
    this.logLevels = ['error', 'warn', 'info', 'debug', 'trace'];
    this.logLevel = options.logLevel || 'info';
    this.logFunction = options.logFunction || console.log;
    this.contractsState = options.contractsState || function () {
      };
    this.setStatus = options.setStatus || console.log;
  }
}

Logger.prototype.error = function (txt) {
  if (!txt || !(this.shouldLog('error'))) {
    return;
  }
  this.logFunction(txt.red);
};

Logger.prototype.warn = function (txt) {
  if (!txt || !(this.shouldLog('warn'))) {
    return;
  }
  this.logFunction(txt.yellow);
};

Logger.prototype.info = function (txt) {
  if (!txt || !(this.shouldLog('info'))) {
    return;
  }
  this.logFunction(txt.green);
};

Logger.prototype.debug = function (txt) {
  if (!txt || !(this.shouldLog('debug'))) {
    return;
  }
  this.logFunction(txt);
};

Logger.prototype.trace = function (txt) {
  if (!txt || !(this.shouldLog('trace'))) {
    return;
  }
  this.logFunction(txt);
};

Logger.prototype.shouldLog = function (level) {
  return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
};

module.exports = Logger;
