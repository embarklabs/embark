const async = require('async');
const Web3 = require('web3');
const {getWeiBalanceFromString, buildUrl} = require('../../utils/utils.js');
const {readFileSync, dappPath} = require('../../core/fs');

class DevFunds {
  constructor(blockchainConfig) {
    this.web3 = null;
    this.blockchainConfig = blockchainConfig;
    this.accounts = [];
    this.numAccounts = this.blockchainConfig.account.numAccounts || 0;
    this.password = readFileSync(dappPath('config/development/password'), 'utf8').replace('\n', '');
    this.web3 = new Web3();
    this.balance = Web3.utils.toWei("1", "ether");
    if(this.blockchainConfig.account.balance){
      console.dir('[blockchain/dev_funds]: converting balance from ' + this.blockchainConfig.account.balance);
      this.balance = getWeiBalanceFromString(this.blockchainConfig.account.balance, this.web3);
      console.dir('[blockchain/dev_funds]: converted balance to ' + this.balance);
    }
  }

  connectToNode(cb) {
    
    this.web3.setProvider(new Web3.providers.WebsocketProvider(buildUrl('ws', this.blockchainConfig.wsHost, this.blockchainConfig.wsPort), {headers: {Origin: "http://localhost:8000"}}));
    
    this.web3.eth.getAccounts().then((accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      this.accounts = accounts;
      cb();
    });
  }

  createAccounts(numAccounts, password, cb) {
    console.dir("creating " + (numAccounts - this.accounts.length) + " new accounts with password " + password);
    async.timesLimit((numAccounts - this.accounts.length), 1, (_, next) => {
      console.dir("--- creating new account");
      this.web3.eth.personal.newAccount(password, next);
    }, (err, accounts) => {
      if(err) console.error(err);
      console.dir("-- accounts created are ");
      console.dir(accounts);
      this.accounts = accounts;
      cb(err);
    }); 
  }

  unlockAccounts(password, cb) {
    async.each(this.accounts, (account, next) => {
      console.dir('-- unlocking account ' + account + ' with password ' + password);
      this.web3.eth.personal.unlockAccount(account, password).then(() => next()).catch(next);
    }, cb);
  }

  fundAccounts(balance, cb) {
    console.dir('-- funding accounts...');
    
    

    async.each(this.accounts, (account, next) => {
      console.dir("-- funding account " + account + " with balance " + balance);
      this.web3.eth.sendTransaction({to: account, value: balance}).then((result) => {
        console.dir('FUNDING ACCT result: ' + JSON.stringify(result));
        next();
      }).catch(next);
    }, (err) => {
      console.dir('-- FINISHED FUNDING ACCOUNTS, err= ' + err);
      cb(err);
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
        this.fundAccounts(this.balance, next);
      }
    ], (err) => {
      console.dir(`--- COMPLETED THE ACCOUNTS (${this.accounts.join(', ')} and funded with ${this.balance} wei)`);
      if(err) console.error('Error creating, unlocking, and funding accounts', err);

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
