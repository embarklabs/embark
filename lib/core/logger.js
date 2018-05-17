require('colors');
let fs = require('./fs.js');
const inversify = require('inversify');
const Events = require('./events');

class Logger {
  constructor(events, logLevel, logFunction, logFile) {
    this.events = events;
    this.logLevels = ['error', 'warn', 'info', 'debug', 'trace'];
    this.logLevel = logLevel || 'info';
    this.logFunction = logFunction || console.log;
    this.logFile = logFile;
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

inversify.decorate(inversify.injectable(), Logger);
inversify.decorate(inversify.inject(Events), Logger, 0);
inversify.decorate(inversify.inject('logLevel'), Logger, 1);
inversify.decorate(inversify.optional(), Logger, 1);
inversify.decorate(inversify.inject('logFunction'), Logger, 2);
inversify.decorate(inversify.optional(), Logger, 2);
inversify.decorate(inversify.inject('logFile'), Logger, 3);
inversify.decorate(inversify.optional(), Logger, 3);

module.exports = Logger;
