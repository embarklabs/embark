const async = require('async');
require('colors');
const fs = require('fs-extra');
const date = require('date-and-time');
const { escapeHtml } = require('./utils');
const util = require('util');

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';
const DELIM = '  ';

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

    this.logFunction = function(args, color) {
      args  = Array.isArray(args) ? args : [args];
      this._logFunction(...(args.filter(arg => arg ?? false).map(arg => {
        if (typeof arg === 'object') arg = util.inspect(arg, 2);
        return color ? arg[color] : arg;
      })));
    };

    this.logFile = options.logFile;
    if (this.logFile) {
      this.fs.ensureFileSync(this.logFile);
    }

    const isDebugOrTrace = ['debug', 'trace'].includes(this.logLevel);
    this.isDebugOrTrace = isDebugOrTrace;

    const noop = () => {};
    this.writeToFile = async.cargo((tasks, callback = noop) => {
      if (!this.logFile) {
        return callback();
      }
      let logs = '';
      tasks.forEach(task => {
        let message = [].concat(task.args).join(' ').trim();
        if (!message) return;
        const dts = `[${date.format(new Date(), DATE_FORMAT)}]`;
        message = message.replace(/\s+/g, ' ');
        let origin = '';
        if (isDebugOrTrace) origin = `${DELIM}${task.origin.match(/^at\s+.*(\(.*\))/)[1] || '(unknown)'}`;
        const prefix = task.prefix;
        logs += `${dts}${DELIM}${prefix}${DELIM}${message}${origin}\n`;
      });

      if (!logs) {
        callback();
      }

      this.fs.appendFile(this.logFile, logs.stripColors, err => {
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

    this.events.emit("log", "error", args);
    this.logFunction(args, 'red');

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[error]" });
  }

  warn(...args) {
    if (!args.length || !(this.shouldLog('warn'))) {
      return;
    }

    this.events.emit("log", "warn", args);
    this.logFunction(args, 'yellow');

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[warn]" });
  }

  info(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }

    this.events.emit("log", "info", args);
    this.logFunction(args, 'green');

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[info]" });
  }

  consoleOnly(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }

    this.logFunction(args, 'green');

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[consoleOnly]" });
  }

  debug(...args) {
    if (!args.length || !(this.shouldLog('debug'))) {
      return;
    }

    this.events.emit("log", "debug", args);
    this.logFunction(args, null);

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[debug]" });
  }

  trace(...args) {
    if (!args.length || !(this.shouldLog('trace'))) {
      return;
    }

    this.events.emit("log", "trace", args);
    this.logFunction(args, null);

    let origin;
    if (this.isDebugOrTrace) {
      try {
        const stack = new Error().stack;
        origin = stack.split('\n')[2].trim();
      // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    this.writeToFile.push({ args, origin, prefix: "[trace]" });
  }

  dir(obj) {
    if (!obj || !(this.shouldLog('info'))) {
      return;
    }

    this.events.emit("log", "dir", obj);
    this.logFunction(obj, null);
  }

  shouldLog(level) {
    const logLevels = Object.keys(LogLevels);
    return (logLevels.indexOf(level) <= logLevels.indexOf(this.logLevel));
  }
}
