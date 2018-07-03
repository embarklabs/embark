const async = require('async');
const AccountParser = require('./accountParser');
const fundAccount = require('./fundAccount');

class Provider {
  constructor(options) {
    this.web3 = options.web3;
    this.accountsConfig = options.accountsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.type = options.type;
    this.web3Endpoint = options.web3Endpoint;
    this.logger = options.logger;
    this.isDev = options.isDev;
  }

  startWeb3Provider(callback) {
    const self = this;

    if (this.type === 'rpc') {
      self.provider = new this.web3.providers.HttpProvider(self.web3Endpoint);
    } else if (this.type === 'ws') {
      self.provider = new this.web3.providers.WebsocketProvider(self.web3Endpoint, {headers: {Origin: "embark"}});
    } else {
      return callback(__("contracts config error: unknown deployment type %s", this.type));
    }

    self.web3.setProvider(self.provider);

    self.accounts = AccountParser.parseAccountsConfig(self.accountsConfig, self.web3, self.logger);
    self.addresses = [];
    if (!self.accounts.length) {
      return callback();
    }
    self.accounts.forEach(account => {
      self.addresses.push(account.address);
      self.web3.eth.accounts.wallet.add(account);
    });

    self.realAccountFunction = self.web3.eth.getAccounts;
    self.web3.eth.getAccounts = function (cb) {
      if (!cb) {
        cb = function () {
        };
      }
      return new Promise((resolve, reject) => {
        self.realAccountFunction((err, accounts) => {
          if (err) {
            cb(err);
            return reject(err);
          }
          accounts = accounts.concat(self.addresses);
          // accounts = self.addresses.concat(accounts);
          cb(null, accounts);
          resolve(accounts);
        });
      });
    };

    callback();
  }

  fundAccounts(callback) {
    const self = this;
    if (!self.accounts.length) {
      return callback();
    }
    if (!self.isDev) {
      return callback();
    }
    async.each(self.accounts, (account, eachCb) => {
      fundAccount(self.web3, account.address, account.hexBalance, eachCb);
    }, callback);
  }
}

module.exports = Provider;
