const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const fs = require('./fs');

class Provider {
  constructor(options) {
    const self  = this;
    this.web3 = options.web3;
    this.accountsConfig = options.accountsConfig;
    this.logger = options.logger;
    this.engine = new ProviderEngine();
    // this.web3 = new Web3(engine);

    this.engine.addProvider(new RpcSubprovider({
      rpcUrl: options.web3Endpoint
    }));

    if (this.accountsConfig && this.accountsConfig.length) {
      this.accounts = [];
      this.accountsConfig.forEach(accountConfig => {
        const account = this.getAccount(accountConfig);
        if (!account) {
          return;
        }
        if (Array.isArray(account)) {
          this.accounts = this.accounts.concat(account);
          return;
        }
        this.accounts.push(this.getAccount(accountConfig));
      });

      /*this.engine.addProvider(new HookedWalletSubprovider({
        getAccounts: function (cb) {
          cb(null, self.accounts);
        },
        approveTransaction: function (cb) {

        },
        signTransaction: function (cb) {

        }
      }));*/
    }


    this.engine.on('block', function (block) {
      console.log('================================');
      console.log('BLOCK CHANGED:', '#' + block.number.toString('hex'), '0x' + block.hash.toString('hex'));
      console.log('================================');
    });

    // network connectivity error
    this.engine.on('error', function (err) {
      // report connectivity errors
      console.error(err.stack);
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
      const wallet_hdpath = "m/44'/60'/0'/0/";

      const accounts = [];
      for (let i = addressIndex; i < addressIndex + numAddresses; i++){
        const wallet = hdwallet.derivePath(wallet_hdpath + i).getWallet();
        accounts.push(this.web3.eth.accounts.privateKeyToAccount(wallet.getPrivateKey()));
      }

      return accounts;
    }
    this.logger.warn('Unsupported account configuration: ' + JSON.stringify(accountConfig));
    this.logger.warn('Try using one of those: ' +
      '{ "privateKey": "your-private-key", "privateKeyFile": "path/to/file/containing/key", "mnemonic": "12 word mnemonic" }');
  }

  sendAsync() {
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }
}

module.exports = Provider;
