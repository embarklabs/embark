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
    this.logFunction = function(...args) {
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
  }


  registerAPICall(plugins) {
    let plugin = plugins.createPlugin('dashboard', {});
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

  writeToFile(...args) {
    if (!this.logFile) {
      return;
    }

    let origin = "[" + ((new Error().stack).split("at ")[3]).trim() + "]";

    const formattedDate = [`[${date.format(new Date(), DATE_FORMAT)}]`]; // adds a timestamp to the logs in the logFile
    fs.appendFileSync(this.logFile, "\n" + formattedDate.concat(origin, args).join(' '));
  }

  error(...args) {
    if (!args.length || !(this.shouldLog('error'))) {
      return;
    }
    this.events.emit("log", "error", args);
    this.logFunction(...Array.from(args), 'red');
    this.writeToFile("[error]: ", args);
  }

  warn(...args) {
    if (!args.length || !(this.shouldLog('warn'))) {
      return;
    }
    this.events.emit("log", "warn", args);
    this.logFunction(...Array.from(args), 'yellow');
    this.writeToFile("[warning]: ", args);
  }

  info(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }
    this.events.emit("log", "info", args);
    this.logFunction(...Array.from(args), 'green');
    this.writeToFile("[info]: ", args);
  }

  consoleOnly(...args) {
    if (!args.length || !(this.shouldLog('info'))) {
      return;
    }
    this.logFunction(...Array.from(args), 'green');
    this.writeToFile("[consoleOnly]: ", args);
  }

  debug(...args) {
    if (!args.length || !(this.shouldLog('debug'))) {
      return;
    }
    this.events.emit("log", "debug", args);
    this.logFunction(args, null);
    this.writeToFile("[debug]: ", args);
  }

  trace(...args) {
    if (!args.length || !(this.shouldLog('trace'))) {
      return;
    }
    this.events.emit("log", "trace", args);
    this.logFunction(args, null);
    this.writeToFile("[trace]: ", args);
  }

  dir(...args) {
    const txt = args[0];
    if (!txt || !(this.shouldLog('info'))) {
      return;
    }
    this.events.emit("log", "dir", txt);
    this.logFunction(txt, null);
    this.writeToFile("[dir]: ", args);
  }

  shouldLog(level) {
    const logLevels = Object.keys(LogLevels);
    return (logLevels.indexOf(level) <= logLevels.indexOf(this.logLevel));
  }
}
