const ProviderEngine = require('embark-web3-provider-engine');
const RpcSubprovider = require('embark-web3-provider-engine/subproviders/rpc');
const WsSubprovider = require('embark-web3-provider-engine/subproviders/websocket');
const CacheSubprovider = require('embark-web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('embark-web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('embark-web3-provider-engine/subproviders/filters.js');
const VmSubprovider = require('embark-web3-provider-engine/subproviders/vm.js');
const NonceSubprovider = require('embark-web3-provider-engine/subproviders/nonce-tracker.js');
const SubscriptionSubprovider = require('embark-web3-provider-engine/subproviders/subscriptions');
const async = require('async');
const AccountParser = require('./accountParser');
const fundAccount = require('./fundAccount');
const EventEmitter = require('events');

EventEmitter.prototype._maxListeners = 300;
const NO_ACCOUNTS = 'noAccounts';

class Provider extends ProviderEngine {
  constructor(options) {
    super();
    this.web3 = options.web3;
    this.accountsConfig = options.accountsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.type = options.type;
    this.web3Endpoint = options.web3Endpoint;
    this.logger = options.logger;
    this.isDev = options.isDev;
    this.asyncMethods = {};
    this.setMaxListeners(300);
  }

  startWeb3Provider(callback) {
    const self = this;

// cache layer
//     self.addProvider(new CacheSubprovider())

    // self.addProvider(new NonceSubprovider())

    if (this.type === 'rpc') {
      self.addProvider(new RpcSubprovider({
        rpcUrl: self.web3Endpoint
      }));
    } else if (this.type === 'ws') {
      console.log('USing ws');
      self.addProvider(new SubscriptionSubprovider());
      self.addProvider(new WsSubprovider({
        rpcUrl: self.web3Endpoint,
        origin: this.blockchainConfig.wsOrigins.split(',')[0]
      }));
    } else {
      return callback(__("contracts config error: unknown deployment type %s", this.type));
    }



    // network connectivity error
    self.on('error', (err) => {
      console.log('ERR', JSON.stringify(err));
      // report connectivity errors as trace due to polling
      self.logger.trace('web3 provider error: ', err);
      self.logger.trace('stopping web3 provider due to error');

      // prevent continuous polling errors
      self.stop();
    });

    self.web3.setProvider(self);
    self.start();

    self.accounts = AccountParser.parseAccountsConfig(self.accountsConfig, self.web3, self.logger);
    self.addresses = [];
    async.waterfall([
      function populateWeb3Wallet(next) {
        if (!self.accounts.length) {
          return next(NO_ACCOUNTS);
        }
        self.accounts.forEach(account => {
          self.addresses.push(account.address);
          self.web3.eth.accounts.wallet.add(account);
        });
        self.asyncMethods = {
          eth_accounts: self.eth_accounts.bind(self)
        };
        next();
      }
    ], function (err) {
      if (err && err !== NO_ACCOUNTS) {
        self.logger.error((err));
      }
      callback();
    });
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
    super.sendAsync(payload, callback);
  }
}

module.exports = Provider;
