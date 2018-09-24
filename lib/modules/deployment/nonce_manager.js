const queue = require('async/queue');

class NonceManager {
  constructor() {
    this._nonceMap = {};
    this.queue = queue((task, callback) => {
      this._getNextNonce(task.account);
      callback();
    }, 1);
  }

  _getNextNonce(account) {
    if (!this._nonceMap.hasOwnProperty(account)) {
      this._nonceMap[account] = -1;
    }
    return ++this._nonceMap[account];
  }

  getNextNonce(account, callback) {
    this.queue.push({account: account}, err => {
      callback(err, this._nonceMap[account]);
    });
  }
}

const instance = new NonceManager();
Object.freeze(instance);

module.exports = instance;
