import { __ } from 'embark-i18n';
const async = require('async');
const { AccountParser, dappPath } = require('embark-utils');
const fundAccount = require('./fundAccount');
const constants = require('embark-core/constants');
const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');

class Provider {
  constructor(options) {
    this.web3 = options.web3;
    this.blockchainConfig = options.blockchainConfig;
    this.type = options.type;
    this.web3Endpoint = options.web3Endpoint;
    this.logger = options.logger;
    this.isDev = options.isDev;
    this.events = options.events;
    this.nonceCache = {};
    this.accounts = [];

    this.events.setCommandHandler("blockchain:provider:contract:accounts:get", cb => {
      const accounts = this.accounts.map(a => a.address || a);
      cb(null, accounts);
    });
    this.events.setCommandHandler("blockchain:provider:contract:accounts:getAll", (cb) => {
      cb(null, this.accounts);
    });
  }

  getNonce(address, callback) {
    this.web3.eth.getTransactionCount(address, (_error, transactionCount) => {
      if(this.nonceCache[address] === undefined) {
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
      self.provider = new this.web3.providers.WebsocketProvider(self.web3Endpoint, {
        headers: {Origin: constants.embarkResourceOrigin},
        // TODO remove this when Geth fixes this: https://github.com/ethereum/go-ethereum/issues/16846
        clientConfig: {
          fragmentationThreshold: 81920
        }
      });

      self.provider.on('error', () => self.logger.error('Websocket Error'));
      self.provider.on('end', () => self.logger.error('Websocket connection ended'));
    } else {
      return callback(__("contracts config error: unknown deployment type %s", this.type));
    }
    self.web3.setProvider(self.provider);

    self.web3.eth.getAccounts((err, accounts = []) => {
      if (err) {
        self.logger.warn('Error while getting the node\'s accounts.', err.message || err);
      }

      try {
        self.accounts = AccountParser.parseAccountsConfig(self.blockchainConfig.accounts, self.web3, dappPath(), self.logger, accounts);
      } catch (e) {
        return callback(e);
      }

      if (!self.accounts.length) {
        self.accounts = accounts;
      }
      self.addresses = [];

      self.accounts.forEach(account => {
        self.addresses.push(account.address || account);
        if (account.privateKey) {
          self.web3.eth.accounts.wallet.add(account);
        }
      });
      self.addresses = [...new Set(self.addresses)]; // Remove duplicates

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
              result.result = self.addresses;
            }
            cb(null, result);
          });
        } else if (payload.method === constants.blockchain.transactionMethods.eth_sendRawTransaction) {
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

  async fundAccounts() {
    if (!this.accounts.length) {
      return;
    }
    if (!this.isDev) {
      return;
    }

    const coinbaseAddress = await this.getCoinbaseAddress(this.web3);

    const fundAccountPromises = [];
    for (let account of this.accounts) {
      if (!account.address) {
        continue;
      }
      fundAccountPromises.push(fundAccount(this.web3, account.address, coinbaseAddress, account.hexBalance));
    }
    // run in parallel
    await Promise.all(fundAccountPromises);
  }

  async getCoinbaseAddress(web3) {

    const findAccountWithMostFunds = async() => {
      let highestBalance = {
        balance: web3.utils.toBN(0),
        address: ""
      };
      for (let account of this.accounts) {
        const address = account.address;
        // eslint-disable-next-line no-await-in-loop
        let balance = await web3.eth.getBalance(address);
        balance = web3.utils.toBN(balance);
        if (balance.gt(highestBalance.balance)) {
          highestBalance = { balance, address };
        }
      }
      return highestBalance.address;
    };

    const findAlternativeCoinbase = async() => {
      try {
        return findAccountWithMostFunds();
      }
      catch (err) {
        throw new Error(`Error getting coinbase address: ${err.message || err}`);
      }
    };

    try {
      const coinbaseAddress = await web3.eth.getCoinbase();
      // if the blockchain returns a zeroed address, we can find the account
      // with the most funds and use that as the "from" account to txfer
      // funds.
      if (!coinbaseAddress || web3.utils.hexToNumberString(coinbaseAddress) === "0") { // matches 0x0 and 0x00000000000000000000000000000000000000
        return await findAlternativeCoinbase();
      }
      return coinbaseAddress;
    }
    catch (err) {
      // if the blockchain doesn't support 'eth_coinbase' RPC commands, 
      // we can find the account with the most funds and use that as the 
      // "from" account to txfer funds.
      if (err.message.includes("The method eth_coinbase does not exist/is not available")) {
        const coinbase = await findAlternativeCoinbase();
        return coinbase;
      }
      throw new Error(`Error finding coinbase address: ${err.message || err}`);
    }
  }
}

module.exports = Provider;
