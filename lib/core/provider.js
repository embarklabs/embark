const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const fs = require('./fs');

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

    if (this.accountsConfig && this.accountsConfig.length) {
      this.accounts = [];
      this.addresses = [];
      this.accountsConfig.forEach(accountConfig => {
        const account = this.getAccount(accountConfig);
        if (!account) {
          return;
        }
        if (Array.isArray(account)) {
          this.accounts = this.accounts.concat(account);
          account.forEach(acc => {
            this.addresses.push(acc.address);
          });
          return;
        }
        this.accounts.push(account);
        this.addresses.push(account.address);
      });

      if (this.accounts.length) {
        this.accounts.forEach(account => {
          this.web3.eth.accounts.wallet.add(account);
        });
        this.asyncMethods = {
            eth_accounts: self.eth_accounts.bind(this)
        };
      }
    }

    // network connectivity error
    this.engine.on('error', (err) => {
      // report connectivity errors
      this.logger.error(err.stack);
    });
    this.engine.start();
  }

  getAccount(accountConfig) {
    if (accountConfig.privateKey) {
      return this.web3.eth.accounts.privateKeyToAccount(accountConfig.privateKey);
    }
    if (accountConfig.privateKeyFile) {
      let fileContent = fs.readFileSync(fs.dappPath(accountConfig.privateKeyFile)).toString();
      return this.web3.eth.accounts.privateKeyToAccount(fileContent.trim());
    }
    if (accountConfig.mnemonic) {
      const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(accountConfig.mnemonic.trim()));

      const addressIndex = accountConfig.addressIndex || 0;
      const numAddresses = accountConfig.numAddresses || 1;
      const wallet_hdpath = accountConfig.hdpath || "m/44'/60'/0'/0/";

      const accounts = [];
      for (let i = addressIndex; i < addressIndex + numAddresses; i++) {
        const wallet = hdwallet.derivePath(wallet_hdpath + i).getWallet();
        accounts.push(this.web3.eth.accounts.privateKeyToAccount(wallet.getPrivateKey()));
      }

      return accounts;
    }
    this.logger.warn('Unsupported account configuration: ' + JSON.stringify(accountConfig));
    this.logger.warn('Try using one of those: ' +
      '{ "privateKey": "your-private-key", "privateKeyFile": "path/to/file/containing/key", "mnemonic": "12 word mnemonic" }');
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
