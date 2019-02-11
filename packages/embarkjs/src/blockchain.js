/*global ethereum*/
import {reduce} from './async';

let Blockchain = {
  list: [],
  done: false,
  err: null
};
let contracts = [];

Blockchain.connect = function({dappConnection, dappAutoEnable = true, warnAboutMetamask, blockchainClient = ''}, cb) {
  const _cb = () => {};
  const p = new Promise((resolve, reject) => {
    this.whenEnvIsLoaded(() => {
      this.doFirst((done) => {
        this.autoEnable = dappAutoEnable;
        this.doConnect(dappConnection, {
          warnAboutMetamask: warnAboutMetamask,
          blockchainClient: blockchainClient
        }, (err) => {
          (cb || _cb)(err);
          done(err);
          return err ? reject(err) : resolve();
        });
      });
    });
  }).catch(cb ? _cb : e => { throw e; });
  return !cb ? p : cb;
};

Blockchain.doFirst = function(todo) {
  todo((err) => {
    this.done = true;
    this.err = err;
    this.list.map((x) => x.apply(x, [self.err]));
  });
};

Blockchain.whenEnvIsLoaded = function(cb) {
  if (typeof document !== 'undefined' && document !== null && !(/comp|inter|loaded/).test(document.readyState)) {
    document.addEventListener('DOMContentLoaded', cb);
  } else {
    cb();
  }
};

Blockchain.Providers = {};

Blockchain.registerProvider = function(providerName, obj) {
  this.Providers[providerName] = obj;
};

Blockchain.setProvider = function(providerName, options) {
  let provider = this.Providers[providerName];

  if (!provider) {
    throw new Error('Unknown blockchain provider. ' +
      'Make sure to register it first using EmbarkJS.Blockchain.registerProvider(providerName, providerObject');
  }

  this.currentProviderName = providerName;
  this.blockchainConnector = provider;

  provider.init(options);
};

Blockchain.doConnect = function(connectionList, opts, doneCb) {
  const self = this;

  const checkConnect = (next) => {
    this.blockchainConnector.getAccounts((error, _a) => {
      const provider = self.blockchainConnector.getCurrentProvider();
      const connectionString = provider.host;

      if (error) this.blockchainConnector.setProvider(null);

      return next(null, {
        connectionString,
        error,
        connected: !error
      });
    });
  };

  const connectWeb3 = async (next) => {
    const connectionString = 'web3://';

    if (window.ethereum) {
      try {
        if (Blockchain.autoEnable) {
          await ethereum.enable();
        }
        this.blockchainConnector.setProvider(ethereum);
        return checkConnect(next);
      } catch (error) {
        return next(null, {
          connectionString,
          error,
          connected: false
        });
      }
    }

    return next(null, {
      connectionString,
      error: new Error("web3 provider not detected"),
      connected: false
    });
  };

  const connectWebsocket = (value, next) => {
    this.blockchainConnector.setProvider(this.blockchainConnector.getNewProvider('WebsocketProvider', value));
    checkConnect(next);
  };

  const connectHttp = (value, next) => {
    this.blockchainConnector.setProvider(this.blockchainConnector.getNewProvider('HttpProvider', value));
    checkConnect(next);
  };

  let connectionErrs = {};

  this.doFirst(function(cb) {
    reduce(connectionList, false, function(result, connectionString, next) {
      if (result.connected) {
        return next(null, result);
      } else if(result) {
        connectionErrs[result.connectionString] = result.error;
      }

      if (connectionString === '$WEB3') {
        connectWeb3(next);
      } else if (connectionString.indexOf('ws://') >= 0) {
        connectWebsocket(connectionString, next);
      } else {
        connectHttp(connectionString, next);
      }
    }, function(_err, result) {
      if (!result.connected || result.error) {
        const connectionError = new BlockchainConnectionError(connectionErrs);
        cb(connectionError);
        return doneCb(connectionError);
      }

      self.blockchainConnector.getAccounts((err, accounts) => {
        if (err) {
          cb(err);
          return doneCb(err);
        }
        const currentProv = self.blockchainConnector.getCurrentProvider();
        if (opts.warnAboutMetamask && currentProv && currentProv.isMetaMask) {
          // if we are using metamask, ask embark to turn on dev_funds
          // embark will only do this if geth is our client and we are in
          // dev mode
          if(opts.blockchainClient === 'geth') {
            console.warn("%cNote: There is a known issue with Geth that may cause transactions to get stuck when using Metamask. Please log in to the cockpit (http://localhost:8000/embark?enableRegularTxs=true) to enable a workaround. Once logged in, the workaround will automatically be enabled.", "font-size: 2em");
          }
          if(opts.blockchainClient === 'parity') {
            console.warn("%cNote: Parity blocks the connection from browser extensions like Metamask. To resolve this problem, go to https://embark.status.im/docs/blockchain_configuration.html#Using-Parity-and-Metamask", "font-size: 2em");
          }
          console.warn("%cNote: Embark has detected you are in the development environment and using Metamask, please make sure Metamask is connected to your local node", "font-size: 2em");
        }
        if (accounts) {
          self.blockchainConnector.setDefaultAccount(accounts[0]);
        }

        cb();
        doneCb();
      });
    });
  });
};

Blockchain.enableEthereum = function() {
  if (window.ethereum) {
    return ethereum.enable().then((accounts) => {
      this.blockchainConnector.setProvider(ethereum);
      this.blockchainConnector.setDefaultAccount(accounts[0]);
      contracts.forEach(contract => {
        contract.options.from = this.blockchainConnector.getDefaultAccount();
      });
      return accounts;
    });
  }
};

Blockchain.execWhenReady = function(cb) {
  if (this.done) {
    return cb(this.err, this.web3);
  }
  if (!this.list) {
    this.list = [];
  }
  this.list.push(cb);
};

Blockchain.doFirst = function(todo) {
  var self = this;
  todo(function(err) {
    self.done = true;
    self.err = err;
    if (self.list) {
      self.list.map((x) => x.apply(x, [self.err, self.web3]));
    }
  });
};

let Contract = function(options) {
  var self = this;
  var ContractClass;

  this.abi = options.abi;
  this.address = options.address;
  this.gas = options.gas;
  this.code = '0x' + options.code;

  this.blockchainConnector = Blockchain.blockchainConnector;
  this.web3 = this.blockchainConnector.getInstance();

  ContractClass = this.blockchainConnector.newContract({abi: this.abi, address: this.address});
  contracts.push(ContractClass);
  ContractClass.options.data = this.code;
  const from = this.from || self.blockchainConnector.getDefaultAccount() || this.web3.eth.defaultAccount;
  if (from) {
    ContractClass.options.from = from;
  }
  ContractClass.abi = ContractClass.options.abi;
  ContractClass.address = this.address;
  ContractClass.gas = this.gas;

  let originalMethods = Object.keys(ContractClass);

  Blockchain.execWhenReady(function(_err, _web3) {
    if (!ContractClass.currentProvider) {
      ContractClass.setProvider(self.blockchainConnector.getCurrentProvider() || self.web3.currentProvider);
    }
    ContractClass.options.from = self.blockchainConnector.getDefaultAccount() ||self.web3.eth.defaultAccount;
  });

  ContractClass._jsonInterface.forEach((abi) => {
    if (originalMethods.indexOf(abi.name) >= 0) {
      console.log(abi.name + " is a reserved word and cannot be used as a contract method, property or event");
      return;
    }

    if (!abi.inputs) {
      return;
    }

    let numExpectedInputs = abi.inputs.length;

    if (abi.type === 'function' && abi.constant) {
      ContractClass[abi.name] = function() {
        let ref = ContractClass.methods[abi.name];
        let call = ref.apply(ref, ...arguments).call;
        return call.apply(call, []);
      };
    } else if (abi.type === 'function') {
      ContractClass[abi.name] = function() {
        let options = {}, cb = null, args = Array.from(arguments || []).slice(0, numExpectedInputs);
        if (typeof (arguments[numExpectedInputs]) === 'function') {
          cb = arguments[numExpectedInputs];
        } else if (typeof (arguments[numExpectedInputs]) === 'object') {
          options = arguments[numExpectedInputs];
          cb = arguments[numExpectedInputs + 1];
        }

        let ref = ContractClass.methods[abi.name];
        let send = ref.apply(ref, args).send;
        return send.apply(send, [options, cb]);
      };
    } else if (abi.type === 'event') {
      ContractClass[abi.name] = function(options, cb) {
        let ref = ContractClass.events[abi.name];
        return ref.apply(ref, [options, cb]);
      };
    }
  });

  return ContractClass;
};

Contract.prototype.deploy = function(args, _options) {
  var self = this;
  var contractParams;
  var options = _options || {};

  contractParams = args || [];

  contractParams.push({
    from: this.blockchainConnector.getDefaultAccount() || this.web3.eth.accounts[0],
    data: this.code,
    gas: options.gas || 800000
  });


  const contractObject = this.blockchainConnector.newContract({abi: this.abi});

  return new Promise(function (resolve, reject) {
    contractParams.push(function(err, transaction) {
      if (err) {
        reject(err);
      } else if (transaction.address !== undefined) {
        resolve(new Contract({
          abi: self.abi,
          code: self.code,
          address: transaction.address
        }));
      }
    });

    contractObject["new"].apply(contractObject, contractParams);
  });
};

Contract.prototype.new = Contract.prototype.deploy;

Contract.prototype.at = function(address) {
  return new Contract({abi: this.abi, code: this.code, address: address});
};

Contract.prototype.send = function(value, unit, _options) {
  let options, wei;
  if (typeof unit === 'object') {
    options = unit;
    wei = value;
  } else {
    options = _options || {};
    wei = this.blockchainConnector.toWei(value, unit);
  }

  options.to = this.address;
  options.value = wei;

  return this.blockchainConnector.send(options);
};

Blockchain.Contract = Contract;

class BlockchainConnectionError extends Error {
  constructor(connectionErrors) {
    super("Could not establish a connection to a node.");

    this.connections = connectionErrors;
    this.name = 'BlockchainConnectionError';
  }
}

export default Blockchain;
