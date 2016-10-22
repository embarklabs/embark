var colors = require('colors');

// TODO: just logFunction changes, probably doesn't need a whole new module just
// for this
var TestLogger = function(options) {
  this.logLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  this.logs = [];
  this.logLevel    = options.logLevel || 'info';
};

TestLogger.prototype.logFunction = function() {
  this.logs.push(arguments);
};

TestLogger.prototype.contractsState = function() {
  this.logs.push(arguments);
};

TestLogger.prototype.availableServices = function() {
  this.logs.push(arguments);
};

TestLogger.prototype.error = function(txt) {
  if (!(this.shouldLog('error'))) { return; }
  this.logFunction(txt.red);
};

TestLogger.prototype.warn = function(txt) {
  if (!(this.shouldLog('warn'))) { return; }
  this.logFunction(txt.yellow);
};

TestLogger.prototype.info = function(txt) {
  if (!(this.shouldLog('info'))) { return; }
  this.logFunction(txt.green);
};

TestLogger.prototype.debug = function(txt) {
  if (!(this.shouldLog('debug'))) { return; }
  this.logFunction(txt);
};

TestLogger.prototype.trace = function(txt) {
  if (!(this.shouldLog('trace'))) { return; }
  this.logFunction(txt);
};

TestLogger.prototype.shouldLog = function(level) {
  return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
};

module.exports = TestLogger;
