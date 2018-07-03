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
    this.engine = new ProviderEngine();
    this.asyncMethods = {};
  }

  startWeb3Provider(callback) {
    const self = this;

    if (this.type === 'rpc') {
      self.engine.addProvider(new RpcSubprovider({
        rpcUrl: self.web3Endpoint
      }));
    } else if (this.type === 'ws') {
      //self.engine.addProvider(new WsSubprovider({
      console.log('USing ws');
      self.addProvider(new SubscriptionSubprovider());
      self.addProvider(new WsSubprovider({
        rpcUrl: self.web3Endpoint,
        origin: this.blockchainConfig.wsOrigins.split(',')[0]
      }));
      //self.provider = new this.web3.providers.WebsocketProvider(self.web3Endpoint, {headers: {Origin: "embark"}});
    } else {
      return callback(__("contracts config error: unknown deployment type %s", this.type));
    }


    // network connectivity error
    self.engine.on('error', (err) => {
      // report connectivity errors
      self.logger.error(err);
    });

    self.engine.start();
    //self.on('error', (err) => {
    //  console.log('ERR', JSON.stringify(err));
    //  // report connectivity errors as trace due to polling
    //  self.logger.trace('web3 provider error: ', err);
    //  self.logger.trace('stopping web3 provider due to error');

    //  // prevent continuous polling errors
    //  self.stop();
    //});

    //self.web3.setProvider(self);
    //self.start();

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

  stop() {
    this.engine.stop();
  }

  eth_accounts(payload, cb) {
    return cb(null, this.addresses);
  }

  sendAsync(payload, callback) {
    let method = this.asyncMethods[payload.method];
    if (method) {
      return method.call(method, payload, (err, result) => {
        if (err) {
          return callback(err);
        }
        let response = {'id': payload.id, 'jsonrpc': '2.0', 'result': result};
        callback(null, response);
      });
    }
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }
}

module.exports = Provider;
