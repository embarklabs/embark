require('colors');

// TODO: just logFunction changes, probably doesn't need a whole new module just
// for this
export class TestLogger {
  constructor(options) {
    this.logLevels = ['error', 'warn', 'info', 'debug', 'trace'];
    this.logLevel = options.logLevel || 'info';
  }

  logFunction() {
    console.log(...arguments);
  }

  error(txt) {
    if (!(this.shouldLog('error'))) {
      return;
    }
    this.logFunction(txt.red);
  }

  warn(txt) {
    if (!(this.shouldLog('warn'))) {
      return;
    }
    this.logFunction(txt.yellow);
  }

  info(txt) {
    if (!(this.shouldLog('info'))) {
      return;
    }
    this.logFunction(txt.green);
  }

  debug(txt) {
    if (!(this.shouldLog('debug'))) {
      return;
    }
    this.logFunction(txt);
  }

  trace(txt) {
    if (!(this.shouldLog('trace'))) {
      return;
    }
    this.logFunction(txt);
  }

  shouldLog(level) {
    return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
  }

}
