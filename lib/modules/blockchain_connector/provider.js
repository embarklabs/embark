const async = require('async');
const AccountParser = require('../../utils/accountParser');
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
    // Note: don't pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the followin error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
      self.provider = new this.web3.providers.WebsocketProvider(self.web3Endpoint, {headers: {Origin: "http://embark"}});

      self.provider.on('error', () => self.logger.error('Websocket Error'));
      self.provider.on('end', () => self.logger.error('Websocket connection ended'));
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

    self.web3.eth.getAccounts((err, accounts) => {
      if (err) {
        self.logger.warn('Error while getting the node\'s accounts.', err.message || err);
      }

      self.accounts = AccountParser.parseAccountsConfig(self.accountsConfig, self.web3, self.logger, accounts);
      self.addresses = [];

      if (!self.accounts.length) {
        return callback();
      }

      self.accounts.forEach(account => {
        self.addresses.push(account.address);
        if (account.privateKey) {
          self.web3.eth.accounts.wallet.add(account);
        }
      });
      self.web3.eth.defaultAccount = self.addresses[0];

      const realSend = self.provider.send.bind(self.provider);
      self.provider.send = function (payload, cb) {
        if (payload.method === 'eth_accounts') {
          return realSend(payload, function (err, result) {
            if (err) {
              return cb(err);
            }
            result.result = self.addresses; // Send our addresses
            cb(null, result);
          });
        }
        realSend(payload, cb);
      };

      callback();
    });
  }

  connected() {
    if (this.type === 'rpc') {
      return !!this.provider;
    } else if (this.type === 'ws') {
      return this.provider && this.provider.connected;
    }

    return false;
  }

  stop() {
    if (this.provider && this.provider.removeAllListeners) {
      this.provider.removeAllListeners('connect');
      this.provider.removeAllListeners('error');
      this.provider.removeAllListeners('end');
      this.provider.removeAllListeners('data');
      this.provider.responseCallbacks = {};
    }
    this.provider = null;
    this.web3.setProvider(null);
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
