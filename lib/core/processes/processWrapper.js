const constants = require('../../constants');
const Events = require('./eventsWrapper');

// Override process.chdir so that we have a partial-implementation PWD for Windows
const realChdir = process.chdir;
process.chdir = (...args) => {
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }
  realChdir(...args);
};

class ProcessWrapper {

  /**
   * Class from which process extend. Should not be instantiated alone.
   * Manages the log interception so that all console.* get sent back to the parent process
   * Also creates an Events instance. To use it, just do `this.events.[on|request]`
   *
   * @param {Options}     _options    Nothing for now
   */
  constructor(_options) {
    this.interceptLogs();
    this.events = new Events();

    this.pingParent();
  }

  // Ping parent to see if it is still alive. Otherwise, let's die
  pingParent() {
    const self = this;
    self.retries = 0;
    function error() {
      if (self.retries > 2) {
          self.kill();
          process.exit();
      }
      self.retries++;
    }
    setInterval(() => {
      try {
        let result = self.send({action: 'ping'});
        if (!result) {
          return error();
        }
        self.retries = 0;
      } catch (e) {
        error();
      }
    }, 500);
  }

  interceptLogs() {
    const context = {};
    context.console = console;

    context.console.log = this._log.bind(this, 'log');
    context.console.warn = this._log.bind(this, 'warn');
    context.console.error = this._log.bind(this, 'error');
    context.console.info = this._log.bind(this, 'info');
    context.console.debug = this._log.bind(this, 'debug');
    context.console.trace = this._log.bind(this, 'trace');
    context.console.dir = this._log.bind(this, 'dir');
  }

  _log(type, ...messages) {
    const isHardSource = messages.some(message => {
      return (typeof message === 'string' && message.indexOf('hardsource') > -1);
    });
    if (isHardSource) {
      return;
    }
    this.send({result: constants.process.log, message: messages, type});
  }

  send() {
    if (!process.connected) {
      return false;
    }
    return process.send(...arguments);
  }

  kill() {
    // Should be implemented by derived class
    console.log('Process killed');
  }
}

process.on('exit', () => {
  process.exit(0);
});

module.exports = ProcessWrapper;
