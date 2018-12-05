const async = require('async');
const AccountParser = require('../../utils/accountParser');
const fundAccount = require('./fundAccount');
const constants = require('../../constants');
const Transaction = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');
const ProviderEngine = require('web3-provider-engine');
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default;
const createLedgerSubprovider = require('@ledgerhq/web3-subprovider').default;
const LedgerAppEth = require("@ledgerhq/hw-app-eth").default;
const FetchSubprovider = require('web3-provider-engine/subproviders/fetch.js');
const WebSocketSubProvider = require('web3-provider-engine/subproviders/websocket.js');

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
    this.hardwareWalletConfigs = [];
    this.checkIfHardwareWalletConfigPresent = this.checkIfHardwareWalletConfigPresent.bind(this);
    this.handleLedgerWalletConfig = this.handleLedgerWalletConfig.bind(this);
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

  async startWeb3Provider(callback) {
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

    // check if the hardware wallet config is present and set it as the provider
    if (this.checkIfHardwareWalletConfigPresent()) {
      try {
        await this.handleLedgerWalletConfig();
      }
      catch(error) {
        self.logger.error(error);
        return callback(error);
      }
     
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

      const realSend = this.hardwareWalletConfigs.length > 0 ? self.provider.sendAsync.bind(self.provider): self.provider.send.bind(self.provider);
      
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

        self.getNonce(address, async(newNonce) => {
          tx.nonce = newNonce;

          // then sign the ledger transaction and get the v,r and s values respectively
          if (this.hardwareWalletConfigs.length > 0) {
            let transport = null;

            try {
              // connect to the Ledger
              if(process.platform === 'darwin') {
                transport = await TransportNodeHid.open(this.hardwareWalletConfigs[0].devicePath);
              }
              else {
                transport = await TransportNodeHid.create();
              }

              // sign transaction using Ledger
              const signature = await new LedgerAppEth(transport).signTransaction("44'/60'/0'/0/0", tx.serialize().toString('hex'));
              let v = signature['v'].toString(16);

              // copy the signature parameters and set the correct chainId using the newtworkId 
              tx.r = `0x${signature.r}`;
              tx.s = `0x${signature.s}`;

              // EIP155 support. check/recalc signature v value.
              const rv = parseInt(v, 16);
              const chainId = this.hardwareWalletConfigs[0].networkId;
              let cv = (chainId * 2) + 35;
              if (rv !== cv && (rv & cv) !== rv) { //eslint-disable-line no-bitwise
                cv += 1; // add signature v bit.
              }
              v = cv.toString(16);

              tx.v = `0x${v}`;
              tx._chainId = chainId;
            }
            catch (error) {
              self.logger.error("Unable to re-sign ledger transaction because ", (error.message || error.stack) || error);
              throw error;
            }
            finally {
              if (transport !== null) {
                transport.close(); // close the transport to ensure it doesn't refuse to connect later
              }
            }
          } else {
            const key = ethUtil.stripHexPrefix(self.web3.eth.accounts.wallet[address].privateKey);
            const privKey = Buffer.from(key, 'hex');
            tx.sign(privKey);
          }
       
          payload.params[0] = '0x' + tx.serialize().toString('hex');
          return realSend(payload, (error, result) => {
            self.web3.eth.getTransaction(result.result, () => {
              callback(error, result);
            });
          });
        });
      }, 1);

      const sendTransaction = function(payload, cb) {
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

      self.provider.send = sendTransaction;
      self.provider.sendAsync = sendTransaction;

      callback();
    });
  }

  checkIfHardwareWalletConfigPresent() {
    let ledgerHardwarePresent = false;
    
    if (this.accountsConfig) {
      if(this.accountsConfig.length && this.accountsConfig.length > 0){
        this.accountsConfig.forEach((accountConfig) => {
          if (accountConfig.hardwareWallet) {
            if (accountConfig.hardwareWallet === 'ledger') {
              this.hardwareWalletConfigs.push(accountConfig);
              ledgerHardwarePresent = true;
            }
          }
        });
      }
     
    }
   
    return ledgerHardwarePresent;
  }

  async handleLedgerWalletConfig() {
    const self = this;

    if (!this.hardwareWalletConfigs.length) {
      // TODO when we have documentation for it, add a link in the error message
      throw new Error('No ledger wallet config found, please add it');
    }
    if (this.hardwareWalletConfigs.length > 1) {
      self.logger.warn(__('Mulitple ledger wallet configs found. Selecting the first config only.'));
    }

    let transport = null;
    let getTransport = null;

    if (process.platform === 'darwin') { // workaround for this bug in high sierra https://github.com/LedgerHQ/ledgerjs/issues/213
      try {
       // here we test to see if we can connect to a device and throw an error if we can't
        self.logger.info(__('Testing connection to the ledger device using the path provided, please make sure "browser support" is set to "no" in the device'));
        transport = await TransportNodeHid.open(this.hardwareWalletConfigs[0].devicePath);
      }
      catch (error) {
        self.logger.error("Ledger device connection error. Please make sure the device is connected properly and that no other app is using it");
        throw error; //no need to continue if no device has been detected or in case we get an error
      }
      finally {
        if (transport !== null) {
          transport.close(); // close the transport to ensure it doesn't refuse to connect later

          getTransport = async () => {
            transport = await TransportNodeHid.open(this.hardwareWalletConfigs[0].devicePath);
            transport.setDebugMode(true);
            return transport;
          };
        }
      }
    }
    else {
      try {
       // here we test to see if we can connect to a device and throw an error if we can't
        self.logger.info(__('Testing connection to the ledger device, please make sure "browser support" is set to "no" in the device'));
        transport = await TransportNodeHid.create();
      }
      catch (error) {
        self.logger.error("Ledger device connection error. Please make sure the device is connected properly and that no other app is using it");
        throw error; //no need to continue if no device has been detected or in case we get an error
      }
      finally {
        if (transport !== null) {
          transport.close(); // close the transport to ensure it doesn't refuse to connect later

          getTransport = async () => {
            transport = await TransportNodeHid.create();
            transport.setDebugMode(true);
            return transport;
          };
        }
      }
    }

    const ledger = createLedgerSubprovider(getTransport, {
      networkId: this.hardwareWalletConfigs[0].networkId,  // id of the network you are connecting to
      accountsLength: this.hardwareWalletConfigs[0].numAddresses, // number of accounts to load from the device
      askConfirm: this.hardwareWalletConfigs[0].showDeviceConfirmations // actively show confirmations in the device as its transacting
    });
    
    const engine = new ProviderEngine();
    engine.addProvider(ledger); 

    if (self.type === 'rpc') {
      engine.addProvider(new FetchSubprovider({ rpcUrl: self.web3Endpoint })); 
    }

    if (self.type === 'ws') {
      engine.addProvider(new WebSocketSubProvider({ rpcUrl: self.web3Endpoint, debug: true, origin: constants.embarkResourceOrigin })); 
    }

    engine.start();
    
    self.provider = engine;

    // listen for hardware connectivity error
    self.provider.on('error', (err) => self.logger.error('Ledger wallet error ', (err.message || err.stack) || err));
    self.provider.on('end', () => self.logger.error('Connection to wallet ended'));
  }

  connected() {
    if (this.type === 'rpc' || (this.type === 'ws' && this.hardwareWalletConfigs.length > 0)) {
      return !!this.provider;
    } else if (this.type === 'ws' && this.hardwareWalletConfigs.length === 0) {
      return this.provider && this.provider.connection._connection && this.provider.connection._connection.connected;
    }

    return false;
  }

  stop() {
    if (this.hardwareWalletConfigs.length > 0) {
      this.provider.stop();
    } else if (this.provider && this.provider.removeAllListeners) {
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
