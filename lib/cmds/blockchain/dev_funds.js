const async = require('async');
const Web3 = require('web3');
const { getWeiBalanceFromString, buildUrl } = require('../../utils/utils.js');
const { readFileSync, dappPath } = require('../../core/fs');

class DevFunds {
  constructor(blockchainConfig) {
    this.web3 = null;
    this.blockchainConfig = blockchainConfig;
    this.accounts = [];
    this.numAccounts = this.blockchainConfig.account.numAccounts || 0;
    this.password = readFileSync(dappPath('config/development/password'), 'utf8').replace('\n', '');
    this.web3 = new Web3();
    this.networkId = null;
    this.balance = Web3.utils.toWei("1", "ether");
    if (this.blockchainConfig.account.balance) {
      console.dir('[blockchain/dev_funds]: converting balance from ' + this.blockchainConfig.account.balance);
      this.balance = getWeiBalanceFromString(this.blockchainConfig.account.balance, this.web3);
      console.dir('[blockchain/dev_funds]: converted balance to ' + this.balance);
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

      setInterval(function() { self._sendTx() }, 3000);
      if (cb) {
        cb();
      }
    });
  }

  connectToNode(cb) {

    this.web3.setProvider(new Web3.providers.WebsocketProvider(buildUrl('ws', this.blockchainConfig.wsHost, this.blockchainConfig.wsPort), { headers: { Origin: "http://localhost:8000" } }));

    this.web3.eth.getAccounts().then((accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      if (accounts.length > 1) {
        this.accounts = accounts.slice(1);
      }
      console.dir('----- CURRENT ACCOUNTS ' + this.accounts);
      cb();
    });
  }

  createAccounts(numAccounts, password, cb) {
    const numAccountsToCreate = numAccounts - (this.accounts.length + 1);
    if (numAccountsToCreate === 0) return cb();

    console.dir("creating " + numAccountsToCreate + " new accounts with password " + password);
    async.timesLimit(numAccountsToCreate, 1, (_, next) => {
      console.dir("--- creating new account");
      this.web3.eth.personal.newAccount(password, next);
    }, (err, accounts) => {
      if (err) console.error(err);
      console.dir("-- accounts created are ");
      console.dir(accounts);
      this.accounts = accounts;
      cb(err);
    });
  }

  unlockAccounts(password, cb) {
    console.dir('--- CURRENT ACCOUNTS ' + this.accounts);
    async.each(this.accounts, (account, next) => {
      console.dir('-- unlocking account ' + account + ' with password ' + password);
      this.web3.eth.personal.unlockAccount(account, password).then((result) => {
        console.dir('-- unlocked account ' + account + ' with password ' + password + ' and result ' + result);
        next();
      }).catch(next);
    }, (err) => {
      console.dir('-- FINISHED UNLOCKING ACCOUNTS, err= ' + err);
      cb(err);
    });
  }

  fundAccounts(balance, cb) {
    console.dir('-- funding accounts...');

    async.each(this.accounts, (account, next) => {
      this.web3.eth.getBalance(account).then(currBalance => {
        const remainingBalance = balance - currBalance;
        console.dir("---- account " + account + " balance needed = " + remainingBalance);
        if (remainingBalance <= 0) return next();

        console.dir("-- funding account " + account + " with balance " + remainingBalance);
        this.web3.eth.sendTransaction({to: account, value: remainingBalance}).then((result) => {
          console.dir('FUNDING ACCT result: ' + JSON.stringify(result));
          next();
        }).catch(next);
      }, (err) => {
        console.dir('-- FINISHED FUNDING ACCOUNTS, err= ' + err);
        cb(err);
      });
    });
  }

  createFundAndUnlockAccounts(cb) {
    async.waterfall([
      (next) => {
        console.dir('--- CONNECTING TO NODE');
        this.connectToNode(next);
      },
      (next) => {
        console.dir('--- CREATING THE ACCOUNTS');
        this.createAccounts(this.numAccounts, this.password, next);
      },
      (next) => {
        console.dir('--- UNLOCKING THE ACCOUNTS');
        this.unlockAccounts(this.password, next);
      },
      (next) => {
        console.dir('--- FUNDING THE ACCOUNTS');
        this.regularTxs();
        this.fundAccounts(this.balance, next);
      }
    ], (err) => {
      console.dir(`--- COMPLETED THE ACCOUNTS (${this.accounts.join(', ')} and funded with ${this.balance} wei)`);
      if (err) console.error('Error creating, unlocking, and funding accounts', JSON.stringify(err));

      // this.web3.eth.getAccounts().then((accounts) => {
      //   let numAccts = accounts.length;
      //   accounts.forEach((account) => {
      //     this.web3.eth.getBalance(account).then((balance) => {
      //       console.dir('[contracts/dev_funds]: account ' + account + ' has balance of ' + balance);
      //       if(--numAccts === 0) cb(err);
      //     });
      //   });
      // });
      cb(err);
    });
  }
}

module.exports = DevFunds;
