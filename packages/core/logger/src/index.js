const async = require('async');
require('colors');
const fs = require('fs');
const date = require('date-and-time');
const { escapeHtml } = require('./utils');
const util = require('util');

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';

export const LogLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  trace: 'trace'
};

export class Logger {
  constructor(options) {
    this.events = options.events || {emit: function(){}};
    this.logLevel = options.logLevel || 'info';
    this._logFunction = options.logFunction || console.log;
    this.fs = options.fs || fs;
    this.logFunction = function(...args) {
      const color = args[args.length - 1];
      args.splice(args.length - 1, 1);
      this._logFunction(...args.filter(arg => arg ?? false).map(arg => {
        if (color) {
          return typeof arg === 'object' ? util.inspect(arg, 2)[color] : arg[color];
        }
        return typeof arg === 'object' ? util.inspect(arg, 2) : arg;
      }));
    };
    this.logFile = options.logFile;

    this.writeToFile = async.cargo((tasks, callback) => {
      if (!this.logFile) {
        return callback();
      }
      let logs = '';
      let origin = "[" + ((new Error().stack).split("at ")[3]).trim() + "]";
      tasks.forEach(task => {
        logs += `[${date.format(new Date(), DATE_FORMAT)}] ${task.prefix} ${task.args}\n`;
      });
      this.fs.appendFile(this.logFile, `\n${origin} ${logs}`, err => {
        if (err) {
          this.logFunction(`There was an error writing to the log file: ${err}`, 'red');
          return callback(err);
        }
        callback();
      });
    });
  }

  registerAPICall(plugins) {
    let plugin = plugins.createPlugin('logger', {});
    plugin.registerAPICall(
      'ws',
      '/embark-api/logs',
      (ws, _req) => {
        this.events.on("log", (logLevel, logMsg) => {
          logMsg = escapeHtml(logMsg);
          ws.send(JSON.stringify({msg: logMsg, msg_clear: logMsg.stripColors, logLevel: logLevel}), () => {});
        });
      }
    );
  }

  error(...args) {
    if (!args.length || !(this.shouldLog('error'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "error", args);
    this.logFunction(...args, 'red');
    this.writeToFile.push({ prefix: "[error]: ", args }, callback);
  }

  warn(...args) {
    if (!args.length || !(this.shouldLog('warn'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "warn", args);
    this.logFunction(...args, 'yellow');
    this.writeToFile.push({ prefix: "[warning]: ", args }, callback);
  }

  info(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "info", args);
    this.logFunction(...args, 'green');
    this.writeToFile.push({ prefix: "[info]: ", args }, callback);
  }

  consoleOnly(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.logFunction(...args, 'green');
    this.writeToFile.push({prefix: "[consoleOnly]: ", args }, callback);
  }

  debug(...args) {
    if (!args.length || !(this.shouldLog('debug'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "debug", args);
    this.logFunction(...args, null);
    this.writeToFile.push({ prefix: "[debug]: ", args }, callback);
  }

  trace(...args) {
    if (!args.length || !(this.shouldLog('trace'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "trace", args);
    this.logFunction(...args, null);
    this.writeToFile.push({ prefix: "[trace]: ", args }, callback);
  }

  dir(...args) {
    const txt = args[0];
    if (!txt || !(this.shouldLog('info'))) {
      return;
    }

    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
      args.splice(args.length - 1, 1);
    }

    this.events.emit("log", "dir", txt);
    this.logFunction(txt, null);
    this.writeToFile({ prefix: "[dir]: ", args }, callback);
  }

  shouldLog(level) {
    const logLevels = Object.keys(LogLevels);
    return (logLevels.indexOf(level) <= logLevels.indexOf(this.logLevel));
  }
}

