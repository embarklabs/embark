const async = require('async');
var Web3 = require('web3');
var utils = require('../../utils/utils.js');

class DevFunds {
  constructor(blockchainConfig) {
    this.web3 = null;
    this.blockchainConfig = blockchainConfig;
    this.accounts = [];
    this.numAccounts = this.blockchainConfig.account.numAccounts || 0;
    //this.balance = this.blockchainConfig.account.balance || Web3.utils.toWei("1", "ether");
    this.balance = Web3.utils.toWei("1", "ether");
    this.password = "dev_password"
  }

  connectToNode(cb) {
    const self = this;
    this.web3 = new Web3();
    this.web3.setProvider(new Web3.providers.WebsocketProvider(utils.buildUrl('ws', this.blockchainConfig.wsHost, this.blockchainConfig.wsPort), {headers: {Origin: "http://localhost:8000"}}));
    this.web3.eth.getAccounts().then((accounts) => {
      self.web3.eth.defaultAccount = accounts[0];
      cb();
    });
  }

  createAccounts(numAccounts, password, cb) {
    console.dir("creating " + numAccounts + " with password " + password);
    const self = this;
    async.timesLimit(numAccounts, 1, (_, next) => {
      console.dir("--- creating new account");
      self.web3.eth.personal.newAccount(password, next);
    }, (err, accounts) => {
      console.dir("-- accounts created are ");
      console.dir(accounts);
      this.accounts = accounts;
      cb(err);
    }); 
  }

  unlockAccounts(password, cb) {
    const self = this;
    async.each(this.accounts, (account, next) => {
      self.web3.eth.personal.unlockAccount(account, password).then(() => { next() });
    }, cb);
  }

  fundAccounts(balance, cb) {
    const self = this;
    async.each(this.accounts, (account, next) => {
      self.web3.eth.sendTransaction({to: account, value: balance}).then(() => {
        next();
      });
    }, cb);
  }

  createFundAndUnlockAccounts(cb) {
    const self = this;
    async.waterfall([
      function connect(next) {
        self.connectToNode(next);
      },
      function create(next) {
        self.createAccounts(self.numAccounts, self.password, next)
      },
      function unlock(next) {
        self.unlockAccounts(self.password, next);
      },
      function fund(next) {
        self.fundAccounts(self.balance, next);
      },
    ], cb);
  }
}

module.exports = DevFunds;
