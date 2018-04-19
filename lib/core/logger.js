require('colors');
let fs = require('./fs.js');

class Logger {
  constructor(options) {
    this.events = options.events || {emit: function(){}};
    this.logLevels = ['error', 'warn', 'info', 'debug', 'trace'];
    this.logLevel = options.logLevel || 'info';
    this.logFunction = options.logFunction || console.log;
    this.logFile = options.logFile;
  }
}

Logger.prototype.writeToFile = function (txt) {
  if (!this.logFile) {
    return;
  }

  fs.appendFileSync(this.logFile, "\n" + txt);
};

Logger.prototype.error = function (txt) {
  if (!txt || !(this.shouldLog('error'))) {
    return;
  }
  this.events.emit("log", "error", txt);
  this.logFunction(txt.red);
  this.writeToFile("[error]: " + txt);
};

Logger.prototype.warn = function (txt) {
  if (!txt || !(this.shouldLog('warn'))) {
    return;
  }
  this.events.emit("log", "warning", txt);
  this.logFunction(txt.yellow);
  this.writeToFile("[warning]: " + txt);
};

Logger.prototype.info = function (txt) {
  if (!txt || !(this.shouldLog('info'))) {
    return;
  }
  this.events.emit("log", "info", txt);
  this.logFunction(txt.green);
  this.writeToFile("[info]: " + txt);
};

Logger.prototype.debug = function (txt) {
  if (!txt || !(this.shouldLog('debug'))) {
    return;
  }
  this.events.emit("log", "debug", txt);
  this.logFunction(txt);
  this.writeToFile("[debug]: " + txt);
};

Logger.prototype.trace = function (txt) {
  if (!txt || !(this.shouldLog('trace'))) {
    return;
  }
  this.events.emit("log", "trace", txt);
  this.logFunction(txt);
  this.writeToFile("[trace]: " + txt);
};

Logger.prototype.dir = function (txt) {
  if (!txt || !(this.shouldLog('info'))) {
    return;
  }
  this.events.emit("log", "dir", txt);
  this.logFunction(txt);
  this.writeToFile("[dir]: ");
  this.writeToFile(txt);
};

Logger.prototype.shouldLog = function (level) {
  return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
};

module.exports = Logger;
