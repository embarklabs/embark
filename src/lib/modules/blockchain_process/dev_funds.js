const async = require('async');
const Web3 = require('web3');
const {buildUrl} = require('../../utils/utils.js');
const {readFileSync, dappPath} = require('../../core/fs');

class DevFunds {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.accounts = [];
    this.numAccounts = this.blockchainConfig.account.numAccounts || 0;
    this.password = this.blockchainConfig.account.password ? readFileSync(dappPath(this.blockchainConfig.account.password), 'utf8').replace('\n', '') : 'dev_password';
    this.networkId = null;
    this.balance = Web3.utils.toWei("1", "ether");
    this.provider = options.provider || new Web3.providers.WebsocketProvider(buildUrl('ws', this.blockchainConfig.wsHost, this.blockchainConfig.wsPort), {headers: {Origin: "http://embark"}});
    this.web3 = new Web3(this.provider);
    if (this.blockchainConfig.account.balance) {
      this.balance = this.blockchainConfig.account.balance;
    }
    this.logger = options.logger || console;
  }

  static async new(options) {
    const df = new DevFunds(options);
    await df._init();
    return df;
  }

  async _init() {
    const accounts = await this.web3.eth.getAccounts();
    this.web3.eth.defaultAccount = accounts[0];
    if (accounts.length > 1) {
      this.accounts = accounts.slice(1);
    }
  }

  _sendTx() {
    // Send TXs only in dev networks
    if (this.networkId !== 1337 && this.networkId !== 17) {
      return;
    }
    this.web3.eth.sendTransaction({value: "1000000000000000", to: "0xA2817254cb8E7b6269D1689c3E0eBadbB78889d1", from: this.web3.eth.defaultAccount});
  }

  _regularTxs(cb) {
    const self = this;
    self.web3.eth.net.getId().then((networkId) => {
      self.networkId = networkId;
      if (self.networkId !== 1337) {
        return;
      }
      setInterval(function() { self._sendTx(); }, 1500);
      if (cb) {
        cb();
      }
    });
  }

  _fundAccounts(balance, cb) {
    async.each(this.accounts, (account, next) => {
      this.web3.eth.getBalance(account).then(currBalance => {
        const remainingBalance = balance - currBalance;
        if (remainingBalance <= 0) return next();
        this.web3.eth.sendTransaction({to: account, value: remainingBalance}).catch(console.error);
        next();  // don't wait for the tx receipt as it never comes!
      }).catch(console.error);
    }, cb);
  }

  // TOCHECK:
  // This function is not used anymore, but I leave because it is used for testing purpose (see test/devFunds.js)
  // I suggest to remove this function and the corresponding test case
  createAccounts(numAccounts, password, cb) {
    const numAccountsToCreate = numAccounts - (this.accounts.length + 1);
    if (numAccountsToCreate === 0) return cb();
    async.timesLimit(numAccountsToCreate, 1, (_, next) => {
      this.web3.eth.personal.newAccount(password, next);
    }, (err, accounts) => {
      if (err) return cb(err);
      this.accounts = accounts;
      cb();
    });
  }

  // TOCHECK:
  // This function is not used anymore, but I leave because it is used for testing purpose (see test/devFunds.js)
  // I suggest to remove this function and the corresponding test case
  unlockAccounts(password, cb) {
    async.each(this.accounts, (account, next) => {
      this.web3.eth.personal.unlockAccount(account, password).then((_result) => {
        next();
      }).catch(next);
    }, cb);
  }

  fundAccounts(pingForever = false, cb) {
    if (!this.web3) {
      return cb();
    }
    async.waterfall([
      (next) => {
        if (pingForever) this._regularTxs();
        this._fundAccounts(this.balance, next);
      }
    ], cb);
  }
}

module.exports = DevFunds;
