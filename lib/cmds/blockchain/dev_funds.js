const async = require('async');
const Web3 = require('web3');
const {getWeiBalanceFromString, buildUrl} = require('../../utils/utils.js');
const {readFileSync, dappPath} = require('../../core/fs');

class DevFunds {
  constructor(blockchainConfig) {
    // TODO: temporary to avoid nasty suprises, should be removed
    try {
      this.web3 = null;
      this.blockchainConfig = blockchainConfig;
      this.accounts = [];
      this.numAccounts = this.blockchainConfig.account.numAccounts || 0;
      this.password = readFileSync(dappPath(blockchainConfig.account.password), 'utf8').replace('\n', '');
      this.web3 = new Web3();
      this.networkId = null;
      this.balance = Web3.utils.toWei("1", "ether");
      if (this.blockchainConfig.account.balance) {
        this.balance = getWeiBalanceFromString(this.blockchainConfig.account.balance, this.web3);
      }
    } catch(_err) {
      // empty for now
    }
  }

  _sendTx() {
    if (this.networkId !== 1337) {
      return;
    }
    this.web3.eth.sendTransaction({value: "1000000000000000", to: "0xA2817254cb8E7b6269D1689c3E0eBadbB78889d1", from: this.web3.eth.defaultAccount});
  }

  // trigger regular txs due to a bug in geth and stuck transactions in --dev mode
  regularTxs(cb) {
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

  regularUnlocks() {
    const self = this;
    setInterval(function() { self.unlockAccounts(self.password, () => {}); }, 20000);
  }

  connectToNode(cb) {

    this.web3.setProvider(new Web3.providers.WebsocketProvider(buildUrl('ws', this.blockchainConfig.wsHost, this.blockchainConfig.wsPort), {headers: {Origin: "http://localhost:8000"}}));

    this.web3.eth.getAccounts().then((accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      if (accounts.length > 1) {
        this.accounts = accounts.slice(1);
      }
      cb();
    });
  }

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

  unlockAccounts(password, cb) {
    async.each(this.accounts, (account, next) => {
      this.web3.eth.personal.unlockAccount(account, password).then((_result) => {
        next();
      }).catch(next);
    }, cb);
  }

  fundAccounts(balance, cb) {

    async.each(this.accounts, (account, next) => {
      this.web3.eth.getBalance(account).then(currBalance => {
        const remainingBalance = balance - currBalance;
        if (remainingBalance <= 0) return next();

        this.web3.eth.sendTransaction({to: account, value: remainingBalance}).then((_result) => {
          next();
        }).catch(next);
      }, cb);
    });
  }

  createFundAndUnlockAccounts(cb) {
    if (!this.web3) {
      return cb();
    }
    async.waterfall([
      (next) => {
        this.connectToNode(next);
      },
      (next) => {
        this.createAccounts(this.numAccounts, this.password, next);
      },
      (next) => {
        this.unlockAccounts(this.password, next);
      },
      (next) => {
        this.regularTxs();
        this.regularUnlocks();
        this.fundAccounts(this.balance, next);
      }
    ], cb);
  }
}

module.exports = DevFunds;
