const child_process = require('child_process');
const constants = require('../constants');


class ProcessLauncher {

  /**
   * Constructor of ProcessLauncher. Forks the module and sets up the message handling
   * @param {Object}    options   Options tp start the process
   *        * modulePath      {String}    Absolute path to the module to fork
   *        * logger          {Object}    Logger
   *        * normalizeInput  {Function}  Function to normalize logs
   *        * events          {Function}  Events Emitter instance
   * @return {ProcessLauncher}    The ProcessLauncher instance
   */
  constructor(options) {
    this.process = child_process.fork(options.modulePath);
    this.logger = options.logger;
    this.normalizeInput = options.normalizeInput;
    this.events = options.events;

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
        return this._handleEvent(msg);
      }
      this._checkSubscriptions(msg);
    });
  }

  // Translates logs from the child process to the logger
  _handleLog(msg) {
    if (this.logger[msg.type]) {
      return this.logger[msg.type](this.normalizeInput(msg.message));
    }
    this.logger.debug(this.normalizeInput(msg.message));
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
    let subscriptions;
    let messageKey;
    // Find if the message contains a key that we are subscribed to
    messageKeys.some(_messageKey => {
      return subscriptionsKeys.some(subscriptionKey => {
        if (_messageKey === subscriptionKey) {
          subscriptions = this.subscriptions[subscriptionKey];
          messageKey = _messageKey;
          return true;
        }
        return false;
      });
    });

    if (subscriptions) {
      let subscription;
      // Find if we are subscribed to one of the values
      subscriptions.some(sub => {
        if (msg[messageKey] === sub.value) {
          subscription = sub;
          return true;
        }
        return false;
      });

      if (subscription) {
        // We are subscribed to that message, call the callback
        subscription.callback(msg);
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
  subscribeTo(key, value, callback) {
    if (this.subscriptions[key]) {
      this.subscriptions[key].push({value, callback});
      return;
    }
    this.subscriptions[key] = [{value, callback}];
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
    this.process.send(...arguments);
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
