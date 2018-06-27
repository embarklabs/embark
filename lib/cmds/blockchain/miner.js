const NetcatClient = require('netcat/client');

//Constants
const minerStart = 'miner_start';
const minerStop = 'miner_stop';
const getHashRate = 'miner_getHashrate';
const getCoinbase = 'eth_coinbase';
const getBalance = 'eth_getBalance';
const newBlockFilter = 'eth_newBlockFilter';
const getChanges = 'eth_getFilterChanges';

class GethMiner {
  constructor() {
    const self = this;
    // TODO: Find a way to load mining config from YML.
    // In the meantime, just set an empty config object
    this.config = {};

    const defaults = {
      interval_ms: 15000,
      initial_ether: 15000000000000000000,
      mine_pending_txns: true,
      mine_periodically: false,
      mine_normally: false,
      threads: 1
    };

    for (let key in defaults) {
      if (this.config[key] === undefined) {
        this.config[key] = defaults[key];
      }
    }

    const isWin = process.platform === "win32";

    let ipcPath;
    if (isWin) {
      ipcPath = '\\\\.\\pipe\\geth.ipc';
    } else {
      ipcPath = this.datadir + '/geth.ipc';
    }

    this.client = new NetcatClient();
    this.client.unixSocket(ipcPath)
      .enc('utf8')
      .connect()
      .on('data', function(response){
        try {
          response = JSON.parse(response);
        } catch (e) {
          console.error(e);
          return;
        }
        if (self.callback) {
          self.callback(response.error, response.result);
          self.callback = null;
        }
      });

    if (this.config.mine_normally) {
      return this.sendCommand(minerStart);
    }

    self.sendCommand(minerStop, () => {
      self.fundAccount(function (err) {
        if (err) {
          console.error(err);
          return;
        }
        if (this.config.mine_periodically) self.start_periodic_mining();
        if (this.config.mine_pending_txns) self.start_transaction_mining();
      });
    });

  }

  sendCommand(method, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (callback) {
      this.callback = callback;
    }
    this.client.send(JSON.stringify({"jsonrpc": "2.0", "method": method, "params": params || [], "id": 1}));
  }

  getCoinbase(callback) {
    if (this.coinbase) {
      return callback(null, this.coinbase);
    }
    this.sendCommand(getCoinbase, (err, response) => {
      if (err) {
        return callback(err);
      }
      this.coinbase = response.result;
      if (!this.coinbase) {
        return callback('Failed getting coinbase account');
      }
      callback(null, this.coinbase);
    });
  }

  accountFunded(callback) {
    const self = this;
    self.getCoinbase((err, coinbase) => {
      if (err) {
        return callback(err);
      }
      self.sendCommand(getBalance, [coinbase], (err, result) => {
        if (err) {
          return callback(err);
        }
        callback(null, result >= self.config.initial_ether);
      });
    });
  }

  watchNewBlocks() {
    const self = this;
    self.sendCommand(newBlockFilter, (err, filterId) => {
      if (err) {
        console.error(err);
        return;
      }
      const interval = setInterval(() => {
        self.sendCommand(getChanges, [filterId], (err, changes) => {
          if (!changes || !changes.length) {
            return;
          }
          self.accountFunded((err, funded) => {
            if (funded) {
              clearTimeout(interval);
              self.sendCommand(minerStop);
            }
          });
        });
      }, 1000);
    });
  }

  fundAccount(callback) {
    const self = this;

    self.accountFunded((err, funded) => {
      if (err) {
        return callback(err);
      }
      if (funded) {
        return callback();
      }

      console.log("== Funding account");
      this.sendCommand(minerStart);

      self.watchNewBlocks();
    });
  }

  pendingTransactions() {
    if (web3.eth.pendingTransactions === undefined || web3.eth.pendingTransactions === null) {
      return txpool.status.pending || txpool.status.queued;
    }
    else if (typeof web3.eth.pendingTransactions === "function") {
      return web3.eth.pendingTransactions().length > 0;
    }
    else {
      return web3.eth.pendingTransactions.length > 0 || web3.eth.getBlock('pending').transactions.length > 0;
    }
  }

  start_periodic_mining() {
    const self = this;
    let last_mined_ms = Date.now();
    let timeout_set = false;

    self.sendCommand(minerStart);
    web3.eth.filter("latest").watch(function () {
      if ((self.config.mine_pending_txns && self.pendingTransactions()) || timeout_set) {
        return;
      }

      timeout_set = true;

      const now = Date.now();
      const ms_since_block = now - last_mined_ms;
      last_mined_ms = now;

      let next_block_in_ms;

      if (ms_since_block > self.config.interval_ms) {
        next_block_in_ms = 0;
      } else {
        next_block_in_ms = (self.config.interval_ms - ms_since_block);
      }

      self.sendCommand(minerStop);
      console.log("== Looking for next block in " + next_block_in_ms + "ms");

      setTimeout(function () {
        console.log("== Looking for next block");
        timeout_set = false;
        //miner_obj.start(config.threads);
        self.sendCommand(minerStart);
      }, next_block_in_ms);
    });
  }

  start_transaction_mining() {
    const self = this;
    web3.eth.filter("pending").watch(function () {
      self.sendCommand(getHashRate, (err, result) => {
        if (result > 0) return;

        console.log("== Pending transactions! Looking for next block...");
        self.sendCommand(minerStart);
      });
    });

    if (self.config.mine_periodically) return;

    web3.eth.filter("latest").watch(function () {
      if (!self.pendingTransactions()) {
        console.log("== No transactions left. Stopping miner...");
        self.sendCommand(minerStop);
      }
    });
  }
}

module.exports = GethMiner;
