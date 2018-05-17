const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const AccountParser = require('./accountParser');

class Provider {
  constructor(options) {
    const self = this;
    this.web3 = options.web3;
    this.accountsConfig = options.accountsConfig;
    this.logger = options.logger;
    this.engine = new ProviderEngine();
    this.asyncMethods = {};

    this.engine.addProvider(new RpcSubprovider({
      rpcUrl: options.web3Endpoint
    }));

    this.accounts = AccountParser.parseAccountsConfig(this.accountsConfig, this.web3, this.logger);
    this.addresses = [];
    if (this.accounts.length) {
      this.accounts.forEach(account => {
        this.addresses.push(account.address);
        this.web3.eth.accounts.wallet.add(account);
      });
      this.asyncMethods = {
        eth_accounts: self.eth_accounts.bind(this)
      };
    }

    // network connectivity error
    this.engine.on('error', (err) => {
      // report connectivity errors
      this.logger.error(err.stack);
    });
    this.engine.start();
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
