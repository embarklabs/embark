require('colors');
let fs = require('./fs.js');

class Logger {
  constructor(options) {
    this.events = options.events || {emit: function(){}};
    this.logLevels = Object.keys(Logger.logLevels);
    this.logLevel = options.logLevel || 'info';
    this.logFunction = options.logFunction || console.log;
    this.logFile = options.logFile;
  }
}

Logger.logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'trace'
};

Logger.prototype.writeToFile = function () {
  if (!this.logFile) {
    return;
  }

  fs.appendFileSync(this.logFile, "\n" + Array.from(arguments).join(' '));
};

Logger.prototype.error = function () {
  if (!arguments.length || !(this.shouldLog('error'))) {
    return;
  }
  this.events.emit("log", "error", ...arguments);
  this.logFunction(...Array.from(arguments).map(t => { return t ? t.red : t; }));
  this.writeToFile("[error]: ", ...arguments);
};

Logger.prototype.warn = function () {
  if (!arguments.length || !(this.shouldLog('warn'))) {
    return;
  }
  this.events.emit("log", "warning", ...arguments);
  this.logFunction(...Array.from(arguments).map(t => { return t ? t.yellow : t; }));
  this.writeToFile("[warning]: ", ...arguments);
};

Logger.prototype.info = function () {
  if (!arguments.length || !(this.shouldLog('info'))) {
    return;
  }
  this.events.emit("log", "info", ...arguments);
  this.logFunction(...Array.from(arguments).map(t => { return t ? t.green : t; }));
  this.writeToFile("[info]: ", ...arguments);
};

Logger.prototype.debug = function () {
  if (!arguments.length || !(this.shouldLog('debug'))) {
    return;
  }
  this.events.emit("log", "debug", ...arguments);
  this.logFunction(...arguments);
  this.writeToFile("[debug]: ", ...arguments);
};

Logger.prototype.trace = function () {
  if (!arguments.length || !(this.shouldLog('trace'))) {
    return;
  }
  this.events.emit("log", "trace", ...arguments);
  this.logFunction(...arguments);
  this.writeToFile("[trace]: ", ...arguments);
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
