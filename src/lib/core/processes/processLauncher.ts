const child_process = require("child_process");
const constants = require("../../constants");
const path = require("path");
const ProcessLogsApi = require("../../modules/process_logs_api");

let processCount = 1;
class ProcessLauncher {
  private name: string;
  private logger: any;
  private events: any;
  private silent: any;
  private exitCallback: any;
  private embark: any;
  private logs: any[];
  private processLogsApi: any;
  private subscriptions: any;
  private process: any;

  /**
   * Constructor of ProcessLauncher. Forks the module and sets up the message handling
   * @param {Object}    options   Options tp start the process
   *        * modulePath      {String}    Absolute path to the module to fork
   *        * logger          {Object}    Logger
   *        * events          {Function}  Events Emitter instance
   * @return {ProcessLauncher}    The ProcessLauncher instance
   */
  constructor(options: any) {
    this.name = options.name || path.basename(options.modulePath);

    if (this._isDebug()) {
      const childOptions = {stdio: "pipe", execArgv: ["--inspect-brk=" + (60000 + processCount)]};
      processCount++;
      this.process = child_process.fork(options.modulePath, [], childOptions);
    } else {
      this.process = child_process.fork(options.modulePath);
    }
    this.logger = options.logger;
    this.events = options.events;
    this.silent = options.silent;
    this.exitCallback = options.exitCallback;
    this.embark = options.embark;
    this.logs = [];
    this.processLogsApi = new ProcessLogsApi({embark: this.embark, processName: this.name, silent: this.silent});

    this.subscriptions = {};
    this._subscribeToMessages();
  }

  private _isDebug() {
    const argvString = process.execArgv.join();
    return argvString.includes("--debug") || argvString.includes("--inspect");
  }

  // Subscribes to messages from the child process and delegates to the right methods
  private _subscribeToMessages() {
    const self = this;
    this.process.on("message", (msg: any) => {
      if (msg.error) {
        self.logger.error(msg.error);
      }
      if (msg.result === constants.process.log) {
        return self.processLogsApi.logHandler.handleLog(msg);
      }
      if (msg.event) {
        return self._handleEvent(msg);
      }
      self._checkSubscriptions(msg);
    });

    this.process.on("exit", (code: any) => {
      if (self.exitCallback) {
        return self.exitCallback(code);
      }
      if (code) {
        this.logger.info(`Child Process ${this.name} exited with code ${code}`);
      }
    });
  }

  // Handle event calls from the child process
  private _handleEvent(msg: any) {
    const self = this;
    if (!self.events[msg.event]) {
      self.logger.warn("Unknown event method called: " + msg.event);
      return;
    }
    if (!msg.args || !Array.isArray(msg.args)) {
      msg.args = [];
    }
    // Add callback in the args
    msg.args.push((result: any) => {
      self.process.send({
        event: constants.process.events.response,
        eventId: msg.eventId,
        result,
      });
    });
    self.events[msg.event](msg.requestName, ...msg.args);
  }

  // Looks at the subscriptions to see if there is a callback to call
  private _checkSubscriptions(msg: any) {
    const messageKeys = Object.keys(msg);
    const subscriptionsKeys = Object.keys(this.subscriptions);
    let subscriptionsForKey: any;
    let messageKey: any;
    // Find if the message contains a key that we are subscribed to
    messageKeys.some((_messageKey: any) => {
      return subscriptionsKeys.some((subscriptionKey: any) => {
        if (_messageKey === subscriptionKey) {
          subscriptionsForKey = this.subscriptions[subscriptionKey];
          messageKey = _messageKey;
          return true;
        }
        return false;
      });
    });

    if (subscriptionsForKey) {
      // Find if we are subscribed to one of the values
      const subsIndex: any[] = [];
      const subscriptionsForValue: any[] = subscriptionsForKey.filter((sub: any, index: number) => {
        if (msg[messageKey] === sub.value) {
          subsIndex.push(index);
          return true;
        }
        return false;
      });

      if (subscriptionsForValue.length) {
        // We are subscribed to that message, call the callback
        subscriptionsForValue.forEach((subscription: any, index: number) => {
          subscription.callback(msg);

          if (subscription.once) {
            // Called only once, we can remove it
            subscription = null;
            this.subscriptions[messageKey].splice(subsIndex[index], 1);
          }
        });
      }
    }
  }

  /**
   * Subscribe to a message using a key-value pair
   * @param {String}    key       Message key to subscribe to
   * @param {String}    value     Value that the above key must have for the callback to be called
   * @param {Function}  callback  callback(response)
   * @return {void}
   */
  public on(key: any, value: any, callback: any) {
    if (this.subscriptions[key]) {
      this.subscriptions[key].push({value, callback});
      return;
    }
    this.subscriptions[key] = [{value, callback}];
  }

  /**
   * Same as .on, but only triggers once
   * @param {String}    key       Message key to subscribe to
   * @param {String}    value     Value that the above key must have for the callback to be called
   * @param {Function}  callback  callback(response)
   * @return {void}
   */
  public once(key: any, value: any, callback: any) {
    const obj = {value, callback, once: true};
    if (this.subscriptions[key]) {
      this.subscriptions[key].push(obj);
      return;
    }
    this.subscriptions[key] = [obj];
  }

  /**
   * Unsubscribes from a previously subscribed key-value pair (or key if no value)
   * @param {String}  key     Message key to unsubscribe
   * @param {String}  value   [Optional] Value of the key to unsubscribe
   *                            If there is no value, unsubscribes from all the values of that key
   * @return {void}
   */
  public unsubscribeTo(key: any, value: any) {
    if (!value) {
      this.subscriptions[key] = [];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].filter((val: any, index: number) => {
        if (val.value === value) {
          this.subscriptions[key].splice(index, 1);
        }
      });
    }
  }

  /**
   * Unsubscribes from all subscriptions
   * @return {void}
   */
  public unsubscribeToAll() {
    this.subscriptions = {};
  }

  /**
   * Sends a message to the child process. Same as ChildProcess.send()
   * @params {Object}   message     Message to send
   * For other parameters, see:
   *  https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
   * @return {void}
   */
  public send(...args: any) {
    if (!this.process.connected) {
      return false;
    }
    return this.process.send(...args);
  }

  /**
   * Disconnects the child process. It will exit on its own
   * @return {void}
   */
  public disconnect() {
    this.process.disconnect();
  }

  /**
   * Kills the child process
   *  https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
   * @return {void}
   */
  public kill(...args: any) {
    this.process.kill(...args);
  }
}

export default ProcessLauncher;
