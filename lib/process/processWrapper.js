const constants = require('../constants');
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
      return (typeof message === 'string' && message.indexOf('hard-source') > -1);
    });
    if (isHardSource) {
      return;
    }
    process.send({result: constants.process.log, message: messages, type});
  }

  send() {
    process.send(...arguments);
  }
}

process.on('exit', () => {
  process.exit(0);
});

module.exports = ProcessWrapper;
