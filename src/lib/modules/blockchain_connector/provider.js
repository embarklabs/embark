const async = require('async');
const AccountParser = require('../../utils/accountParser');
const fundAccount = require('./fundAccount');
const constants = require('../../constants');
const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

class Provider {
  constructor(options) {
    this.web3 = options.web3;
    this.accountsConfig = options.accountsConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.type = options.type;
    this.web3Endpoint = options.web3Endpoint;
    this.logger = options.logger;
    this.isDev = options.isDev;
    this.nonceCache = {};
  }

  getNonce(address, callback) {
    this.web3.eth.getTransactionCount(address, (_error, transactionCount) => {
      if(!this.nonceCache[address]) {
        this.nonceCache[address] = -1;
      }

      if (transactionCount > this.nonceCache[address]) {
        this.nonceCache[address] = transactionCount;
        return callback(this.nonceCache[address]);
      }

      this.nonceCache[address]++;
      callback(this.nonceCache[address]);
    });
  }

  startWeb3Provider(callback) {
    const self = this;

    if (this.type === 'rpc') {
      self.provider = new this.web3.providers.HttpProvider(self.web3Endpoint);
    } else if (this.type === 'ws') {
    // Note: don't pass to the provider things like {headers: {Origin: "embark"}}. Origin header is for browser to fill
    // to protect user, it has no meaning if it is used server-side. See here for more details: https://github.com/ethereum/go-ethereum/issues/16608
    // Moreover, Parity reject origins that are not urls so if you try to connect with Origin: "embark" it gives the following error:
    // << Blocked connection to WebSockets server from untrusted origin: Some("embark") >>
    // The best choice is to use void origin, BUT Geth rejects void origin, so to keep both clients happy we can use http://embark
      self.provider = new this.web3.providers.WebsocketProvider(self.web3Endpoint, {headers: {Origin: constants.embarkResourceOrigin}});

      self.provider.on('error', () => self.logger.error('Websocket Error'));
      self.provider.on('end', () => self.logger.error('Websocket connection ended'));
    } else {
      return callback(__("contracts config error: unknown deployment type %s", this.type));
    }
    self.web3.setProvider(self.provider);

    self.web3.eth.getAccounts((err, accounts) => {
      if (err) {
        self.logger.warn('Error while getting the node\'s accounts.', err.message || err);
      }

      self.accounts = AccountParser.parseAccountsConfig(self.accountsConfig, self.web3, self.logger, accounts);
      self.addresses = [];

      self.accounts.forEach(account => {
        self.addresses.push(account.address);
        if (account.privateKey) {
          self.web3.eth.accounts.wallet.add(account);
        }
      });

      if (self.accounts.length) {
        self.web3.eth.defaultAccount = self.addresses[0];
      }

      const realSend = self.provider.send.bind(self.provider);

      // Allow to run transaction in parallel by resolving
      // the nonce manually.
      // For each transaction, resolve the nonce by taking the
      // max of current transaction count and the cache we keep
      // locally.
      // Deconstruct the transaction and update the nonce.
      // Before updating the transaction, it must be signed.
      self.runTransaction = async.queue(({payload}, callback) => {
        const rawTx = payload.params[0];
        const rawData = Buffer.from(ethUtil.stripHexPrefix(rawTx), 'hex');
        const tx = new Transaction(rawData, 'hex');
        const address = '0x' + tx.getSenderAddress().toString('hex').toLowerCase();

        self.getNonce(address, (newNonce) => {
          tx.nonce = newNonce;
          const key = ethUtil.stripHexPrefix(self.web3.eth.accounts.wallet[address].privateKey);
          const privKey = Buffer.from(key, 'hex');
          tx.sign(privKey);
          payload.params[0] = '0x' + tx.serialize().toString('hex');
          return realSend(payload, (error, result) => {
            self.web3.eth.getTransaction(result.result, () => {
              callback(error, result);
            });
          });
        });
      }, 1);

      self.provider.send = function(payload, cb) {
        if (payload.method === 'eth_accounts') {
          return realSend(payload, function(err, result) {
            if (err) {
              return cb(err);
            }
            if (self.accounts.length) {
              result.result = self.addresses; // Send our addresses
            }
            cb(null, result);
          });
        } else if (payload.method === 'eth_sendRawTransaction') {
          return self.runTransaction.push({payload}, cb);
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
      return this.provider && this.provider.connection._connection && this.provider.connection._connection.connected;
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
    async.eachLimit(self.accounts, 1, (account, eachCb) => {
      fundAccount(self.web3, account.address, account.hexBalance, eachCb);
    }, callback);
  }
}

module.exports = Provider;
