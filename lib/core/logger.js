require('colors');
let fs = require('./fs.js');
const date = require('date-and-time');

class Logger {
  constructor(options) {
    this.events = options.events || {emit: function(){}};
    this.logLevels = Object.keys(Logger.logLevels);
    this.logLevel = options.logLevel || 'info';
    this.logFunction = options.logFunction || console.log;
    this.logFile = options.logFile;
    this.dateFormat = 'YYYY-MM-DD HH:mm:ss:SSS';
    this.logRegex = /\[(?<date>\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d:\d\d\d)\] (?:\[(?<logLevel>\w*)\]:?)?\s?\s?(?<msg>.*)/gmi;

    // Use a default logFile if none is specified in the cli,
    // in the format .embark/embark-log__YYYY-MM-DD_HH-mm-ss.log.
    // This logFile is needed so that when the backend tab starts,
    // the initial logs of Embark can be displayed.
    if (!this.logFile) {
      const now = new Date();
      this.logFile = fs.dappPath(`.embark/embark-log__${date.format(now, 'YYYY-MM-DD_HH-mm-ss')}.log`);
    }
  }
}

Logger.logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'trace'
};

Logger.prototype.registerAPICall = function (plugins) {
  const self = this;

  let plugin = plugins.createPlugin('dashboard', {});
  plugin.registerAPICall(
    'ws',
    '/embark-api/logs',
    (ws, _req) => {
      self.events.on("log", function (logLevel, logMsg) {
        ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel: logLevel}), () => {});
      });
    }
  );
};

/**
 * Parses the logFile, returning an array of JSON objects containing the
 * log messages.
 *
 * @returns {Array} array containing
 *  - msg: the log message
 *  - logLevel: log level (ie 'info', 'debug')
 *  - name: process name (always "embark")
 *  - timestamp: timestamp of log message (milliseconds since 1/1/1970)
 */
Logger.prototype.parseLogFile = function () {
  let matches;
  let logs = [];
  const logFile = fs.readFileSync(this.logFile, 'utf8');
  while ((matches = this.logRegex.exec(logFile)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === this.logRegex.lastIndex) {
      this.logRegex.lastIndex++;
    }

    if(matches && matches.groups){
      logs.push({
        msg: [matches.groups.msg],
        logLevel: matches.groups.logLevel,
        name: 'embark',
        timestamp: date.parse(matches.groups.date, this.dateFormat).getTime()
      });
    }
  }

  return logs;
};

Logger.prototype.writeToFile = function (_txt) {
  if (!this.logFile) {
    return;
  }
  const formattedDate = [`[${date.format(new Date(), this.dateFormat)}]`]; // adds a timestamp to the logs in the logFile
  fs.appendFileSync(this.logFile, "\n" + formattedDate.concat(Array.from(arguments)).join(' '));
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
  this.events.emit("log", "warn", ...arguments);
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
  this.writeToFile("[dir]: ", ...arguments);
};

Logger.prototype.shouldLog = function (level) {
  return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
};

module.exports = Logger;
