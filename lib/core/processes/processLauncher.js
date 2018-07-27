const child_process = require('child_process');
const constants = require('../../constants');
const path = require('path');
const utils = require('../../utils/utils');

class ProcessLauncher {

  /**
   * Constructor of ProcessLauncher. Forks the module and sets up the message handling
   * @param {Object}    options   Options tp start the process
   *        * modulePath      {String}    Absolute path to the module to fork
   *        * logger          {Object}    Logger
   *        * events          {Function}  Events Emitter instance
   * @return {ProcessLauncher}    The ProcessLauncher instance
   */
  constructor(options) {
    this.name = path.basename(options.modulePath);
    this.process = child_process.fork(options.modulePath);
    this.logger = options.logger;
    this.events = options.events;
    this.silent = options.silent;
    this.exitCallback = options.exitCallback;

    this.subscriptions = {};
    this._subscribeToMessages();
  }

  // Subscribes to messages from the child process and delegates to the right methods
  _subscribeToMessages() {
    const self = this;
    this.process.on('message', (msg) => {
      if (msg.result === constants.process.log) {
        return self._handleLog(msg);
      }
      if (msg.event) {
        return self._handleEvent(msg);
      }
      self._checkSubscriptions(msg);
    });

    this.process.on('exit', (code) => {
      if (self.exitCallback) {
        return self.exitCallback(code);
      }
      if (code) {
        this.logger.info(`Child Process ${this.name} exited with code ${code}`);
      }
    });
  }

  // Translates logs from the child process to the logger
  _handleLog(msg) {
    if (this.silent && msg.type !== 'error') {
      return;
    }
    if (this.logger[msg.type]) {
      return this.logger[msg.type](utils.normalizeInput(msg.message));
    }
    this.logger.debug(utils.normalizeInput(msg.message));
  }

  // Handle event calls from the child process
  _handleEvent(msg) {
    const self = this;
    if (!self.events[msg.event]) {
      self.logger.warn('Unknown event method called: ' + msg.event);
      return;
    }
    if (!msg.args || !Array.isArray(msg.args)) {
      msg.args = [];
    }
    // Add callback in the args
    msg.args.push((result) => {
      self.process.send({
        event: constants.process.events.response,
        result,
        eventId: msg.eventId
      });
    });
    self.events[msg.event](msg.requestName, ...msg.args);
  }

  // Looks at the subscriptions to see if there is a callback to call
  _checkSubscriptions(msg) {
    const messageKeys = Object.keys(msg);
    const subscriptionsKeys = Object.keys(this.subscriptions);
    let subscriptionsForKey;
    let messageKey;
    // Find if the message contains a key that we are subscribed to
    messageKeys.some(_messageKey => {
      return subscriptionsKeys.some(subscriptionKey => {
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
      let subsIndex = [];
      const subscriptionsForValue = subscriptionsForKey.filter((sub, index) => {
        if (msg[messageKey] === sub.value) {
          subsIndex.push(index);
          return true;
        }
        return false;
      });

      if (subscriptionsForValue.length) {
        // We are subscribed to that message, call the callback
        subscriptionsForValue.forEach((subscription, index) => {
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
  on(key, value, callback) {
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
  once(key, value, callback) {
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
  unsubscribeTo(key, value) {
    if (!value) {
      this.subscriptions[key] = [];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].filter((val, index) => {
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
  unsubscribeToAll() {
    this.subscriptions = {};
  }

  /**
   * Sends a message to the child process. Same as ChildProcess.send()
   * @params {Object}   message     Message to send
   * For other parameters, see:
   *  https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback
   * @return {void}
   */
  send() {
    if (!this.process.connected) {
      return false;
    }
    return this.process.send(...arguments);
  }

  /**
   * Disconnects the child process. It will exit on its own
   * @return {void}
   */
  disconnect() {
    this.process.disconnect();
  }

  /**
   * Kills the child process
   *  https://nodejs.org/api/child_process.html#child_process_subprocess_kill_signal
   * @return {void}
   */
  kill() {
    this.process.kill(...arguments);
  }
}

module.exports = ProcessLauncher;
