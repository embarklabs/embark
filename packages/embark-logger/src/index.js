require('colors');
const fs = require('fs');
const date = require('date-and-time');
const { escapeHtml } = require('embark-utils');
const util = require('util');

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';
const LOG_REGEX = new RegExp(/\[(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d:\d\d\d)\] (?:\[(\w*)\]:?)?\s?\s?(.*)/gmi);

class Logger {
  constructor(options) {
    this.events = options.events || {emit: function(){}};
    this.logLevels = Object.keys(Logger.logLevels);
    this.logLevel = options.logLevel || 'info';
    this._logFunction = options.logFunction || console.log;
    this.logFunction = function() {
      const args = Array.from(arguments);
      const color = args[args.length - 1];
      args.splice(args.length - 1, 1);
      this._logFunction(...args.filter(arg => arg !== undefined && arg !== null).map(arg => {
        if (color) {
          return typeof arg === 'object' ? util.inspect(arg, 2)[color] : arg[color];
        }
        return typeof arg === 'object' ? util.inspect(arg, 2) : arg;
      }));
    };
    this.logFile = options.logFile;
    this.context = options.context;
  }

  /**
   * Parses the logFile, returning an array of JSON objects containing the
   * log messages.
   * @param {Number} limit specifies how many log messages to return from the
   *  end of the log file
   * @returns {Array} array containing
   *  - msg: the log message
   *  - logLevel: log level (ie 'info', 'debug')
   *  - name: process name (always "embark")
   *  - timestamp: timestamp of log message (milliseconds since 1/1/1970)
   */
  parseLogFile(limit) {
    let matches;
    let logs = [];
    const logFile = fs.readFileSync(this.logFile, 'utf8');
    while ((matches = LOG_REGEX.exec(logFile)) !== null) {
     // This is necessary to avoid infinite loops with zero-width matches
     if (matches.index === LOG_REGEX.lastIndex) {
       LOG_REGEX.lastIndex++;
     }

     if (matches && matches.length) {
       logs.push({
         msg: [matches[3]],
         logLevel: matches[2],
         name: 'embark',
         timestamp: date.parse(matches[1], DATE_FORMAT).getTime()
       });
     }
    }

    // if 'limit' is specified, get log lines from the end of the log file
    if(limit && limit > 0 && logs.length > limit){
      logs.slice(limit * -1);
    }
    return logs;
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
        logMsg = escapeHtml(logMsg);
        ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel: logLevel}), () => {});
      });
    }
  );
};

Logger.prototype.writeToFile = function (_txt) {
  if (!this.logFile) {
    return;
  }
  const formattedDate = [`[${date.format(new Date(), DATE_FORMAT)}]`]; // adds a timestamp to the logs in the logFile
  fs.appendFileSync(this.logFile, "\n" + formattedDate.concat(Array.from(arguments)).join(' '));
};

Logger.prototype.error = function () {
  if (!arguments.length || !(this.shouldLog('error'))) {
    return;
  }
  this.events.emit("log", "error", ...arguments);
  this.logFunction(...Array.from(arguments), 'red');
  this.writeToFile("[error]: ", ...arguments);
};

Logger.prototype.warn = function () {
  if (!arguments.length || !(this.shouldLog('warn'))) {
    return;
  }
  this.events.emit("log", "warn", ...arguments);
  this.logFunction(...Array.from(arguments), 'yellow');
  this.writeToFile("[warning]: ", ...arguments);
};

Logger.prototype.info = function () {
  if (!arguments.length || !(this.shouldLog('info'))) {
    return;
  }
  this.events.emit("log", "info", ...arguments);
  this.logFunction(...Array.from(arguments), 'green');
  this.writeToFile("[info]: ", ...arguments);
};

Logger.prototype.consoleOnly = function () {
  if (!arguments.length || !(this.shouldLog('info'))) {
    return;
  }
  this.logFunction(...Array.from(arguments), 'green');
  this.writeToFile("[consoleOnly]: ", ...arguments);
};

Logger.prototype.debug = function () {
  if (!arguments.length || !(this.shouldLog('debug'))) {
    return;
  }
  this.events.emit("log", "debug", ...arguments);
  this.logFunction(...arguments, null);
  this.writeToFile("[debug]: ", ...arguments);
};

Logger.prototype.trace = function () {
  if (!arguments.length || !(this.shouldLog('trace'))) {
    return;
  }
  this.events.emit("log", "trace", ...arguments);
  this.logFunction(...arguments, null);
  this.writeToFile("[trace]: ", ...arguments);
};

Logger.prototype.dir = function (txt) {
  if (!txt || !(this.shouldLog('info'))) {
    return;
  }
  this.events.emit("log", "dir", txt);
  this.logFunction(txt, null);
  this.writeToFile("[dir]: ", ...arguments);
};

Logger.prototype.shouldLog = function (level) {
  return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
};

module.exports = Logger;
