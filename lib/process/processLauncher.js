const child_process = require('child_process');
const constants = require('../constants');

class ProcessLauncher {
  constructor(options) {
    this.process = child_process.fork(options.modulePath);
    this.logger = options.logger;
    this.normalizeInput = options.normalizeInput;

    this.subscriptions = {};
    this._subscribeToMessages();
  }

  _subscribeToMessages() {
    const self = this;
    this.process.on('message', (msg) => {
      console.log('Received message', msg);
      if (msg.result === constants.process.log) {
        if (self.logger[msg.type]) {
          return self.logger[msg.type](self.normalizeInput(msg.message));
        }
        self.logger.debug(self.normalizeInput(msg.message));
        return;
      }

      const messageKeys = Object.keys(msg);
      const subscriptionsKeys = Object.keys(self.subscriptions);
      let subscriptions;
      let messageKey;
      // Find if the message contains a key that we are subscribed to
      messageKeys.some(_messageKey => {
        return subscriptionsKeys.some(subscriptionKey => {
          if (_messageKey === subscriptionKey) {
            subscriptions = self.subscriptions[subscriptionKey];
            messageKey = _messageKey;
            return true;
          }
          return false;
        });
      });

      if (subscriptions) {
        console.log('Found the subscriptions');
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
          console.log('Found the sub and calling');
          // We are subscribed to that message, call the callback
          subscription.callback(msg);
        }
      }
    });
  }

  subscribeTo(key, value, callback) {
    console.log('Subscribe to ', key, value);
    if (this.subscriptions[key]) {
      this.subscriptions[key].push(value);
      return;
    }
    this.subscriptions[key] = [{value, callback}];
    console.log('Subs', this.subscriptions);
  }

  unsubscribeTo(key, value) {
    if (!value) {
      this.subscriptions[key] = [];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].filter((val, index) => {
        if (val.value === value) {
          this.subscriptions[key] = this.subscriptions[key].splice(index, 1);
        }
      });
    }
  }

  unsubsribeToAll() {
    this.subscriptions = {};
  }

  send() {
    this.process.send(...arguments);
  }

  disconnect() {
    this.process.disconnect();
  }

  kill() {
    this.process.kill(...arguments);
  }
}

module.exports = ProcessLauncher;
