import { readJsonSync } from 'fs-extra';
import { join } from "path";
import { Events } from './eventsWrapper';

const constants = readJsonSync(join(__dirname, '../../constants.json'));

export class ProcessWrapper {

  /**
   * Class from which process extend. Should not be instantiated alone.
   * Manages the log interception so that all console.* get sent back to the parent process
   * Also creates an Events instance. To use it, just do `this.events.[on|request]`
   *
   * @param {Options}     options    pingParent: true by default
   */
  constructor(options = {}) {
    process.on('uncaughtException', function(e) {
      process.send({error: e.stack});
    });
    this.options = Object.assign({pingParent: true}, options);
    this.interceptLogs();
    this.events = new Events();
    if(this.options.pingParent) {
      this.pingParent();
    }
  }

  // Ping parent to see if it is still alive. Otherwise, let's die
  pingParent() {
    const self = this;
    self.retries = 0;
    function error() {
      if (self.retries > 2) {
          self.kill();
          process.exit(1);
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

  // TODO: find better way - andre
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
