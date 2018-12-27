process.on("uncaughtException", (e: any) => {
  // @ts-ignore
  process.send({error: e.stack});
});

const constants = require("../../constants");
const Events = require("./eventsWrapper").default;

class ProcessWrapper {
  private options: any;
  private events: any;
  private retries: any;

  /**
   * Class from which process extend. Should not be instantiated alone.
   * Manages the log interception so that all console.* get sent back to the parent process
   * Also creates an Events instance. To use it, just do `this.events.[on|request]`
   *
   * @param {Options}     options    pingParent: true by default
   */
  constructor(options = {}) {
    this.options = Object.assign({pingParent: true}, options);
    this.interceptLogs();
    this.events = new Events();
    if (this.options.pingParent) {
      this.pingParent();
    }
  }

  // Ping parent to see if it is still alive. Otherwise, let"s die
  private pingParent() {
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
        const result = self.send({action: "ping"});
        if (!result) {
          return error();
        }
        self.retries = 0;
      } catch (e) {
        error();
      }
    }, 500);
  }

  private interceptLogs() {
    const context: any = {};
    context.console = console;

    context.console.log = this._log.bind(this, "log");
    context.console.warn = this._log.bind(this, "warn");
    context.console.error = this._log.bind(this, "error");
    context.console.info = this._log.bind(this, "info");
    context.console.debug = this._log.bind(this, "debug");
    context.console.trace = this._log.bind(this, "trace");
    context.console.dir = this._log.bind(this, "dir");
  }

  private _log(type: any, ...messages: any[]) {
    const isHardSource = messages.some((message: string) => {
      return (typeof message === "string" && message.indexOf("hardsource") > -1);
    });
    if (isHardSource) {
      return;
    }
    this.send({result: constants.process.log, message: messages, type});
  }

  private send(...args: any) {
    if (!process.connected) {
      return false;
    }
    // @ts-ignore
    return process.send(...args);
  }

  private kill() {
    // Should be implemented by derived class
    console.log("Process killed");
  }
}

process.on("exit", () => {
  process.exit(0);
});

module.exports = ProcessWrapper;
