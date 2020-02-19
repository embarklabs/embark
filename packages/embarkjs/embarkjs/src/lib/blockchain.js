/* global ethereum */

import { reduce } from './async';
import utils from './utils';

let Blockchain = {
  Contract: Contract,
  list: [],
  done: false,
  err: null
};
let contracts = [];

Blockchain.connect = function(options, callback) {
  const connect = ({
    dappConnection,
    dappAutoEnable = true,
    warnIfMetamask,
    blockchainClient = ''
  }) => {
    return new Promise((resolve, reject) => {
      this.whenEnvIsLoaded(() => {
        this.doFirst((done) => {
          this.autoEnable = dappAutoEnable;
          this.doConnect(dappConnection, {
            warnAboutMetamask: warnIfMetamask,
            blockchainClient
          }, async (err) => {
            let _err = err;
            try {
              await done(_err);
            } catch (e) {
              _err = e;
            } finally {
              if (_err) {
                reject(_err);
              } else {
                resolve();
              }
            }
          });
        });
      });
    });
  };

  if (callback) {
    connect(options).then((result) => {
      callback(null, result);
    }).catch(callback);
    return;
  }
  return connect(options);
};

Blockchain.doFirst = function(todo) {
  todo((err) => {
    this.done = true;
    this.err = err;
    return Promise.all(this.list.map((x) => x(this.err)));
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
    if (providerName === 'web3') {
      console.log("the embarkjs-web3 package might be missing from your project dependencies");
    }

    throw new Error([
      'Unknown blockchain provider. Make sure to register it first using',
      'EmbarkJS.Blockchain.registerProvider(providerName, providerObject)'
    ].join(' '));
  }

  this.currentProviderName = providerName;
  this.blockchainConnector = provider;

  provider.init(options);
};

Blockchain.isAvailable = function () {
  if (!this.blockchainConnector) {
    return Promise.resolve(false);
  }
  return this.blockchainConnector.getNetworkId().then(_ => true);
};

Blockchain.doConnect = function(connectionList, opts, doneCb) {
  const self = this;

  const checkConnect = (next) => {
    const provider = self.blockchainConnector.getCurrentProvider();
    const connectionString = provider.host;
    this.blockchainConnector.getNetworkId()
      .then(_id => {
        next(null, {
          connectionString,
          error: null,
          connected: true
        });
      })
      .catch(error => {
        next(null, {
          connectionString,
          error,
          connected: false
        });
      });
  };

  const connectWeb3 = async (next) => {
    const connectionString = 'web3://';

    if (typeof window !== 'undefined' && window.ethereum) {
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

  reduce(connectionList, false, function(result, connectionString, next) {
    if (result.connected) {
      return next(null, result);
    } else if (result) {
      connectionErrs[result.connectionString] = result.error;
    }

    if (connectionString === '$WEB3') {
      connectWeb3(next);
    } else if ((/^wss?:\/\//).test(connectionString)) {
      connectWebsocket(connectionString, next);
    } else {
      connectHttp(connectionString, next);
    }
  }, async function(_err, result) {
    if (!result.connected || result.error) {
      return doneCb(new BlockchainConnectionError(connectionErrs));
    }

    self.blockchainConnector.getAccounts(async (_err, accounts) => {
      const currentProv = self.blockchainConnector.getCurrentProvider();
      if (opts.warnAboutMetamask) {
        // if we are using metamask, ask embark to turn on dev_funds
        // embark will only do this if geth is our client and we are in
        // dev mode
        if (opts.blockchainClient === 'geth') {
          // TODO find a way to share the port number
          console.warn("%cNote: There is a known issue with Geth (when in `--dev` mode) that may cause transactions to get stuck. To enable a workaround, start an Embark console (run command `embark console` in your terminal) or open the dashboard in Cockpit (http://localhost:55555), then type in the console command `devtxs on`. To disable the workaround, type `devtxs off` in the console.", "font-size: 2em");
        }
        if ((currentProv && currentProv.isMetaMask) ||
          (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask)) {
          console.warn("%cNote: Embark has detected you are in the development environment and using Metamask, please make sure Metamask is connected to your local node", "font-size: 2em");
          if(opts.blockchainClient === 'parity') {
            console.warn("%cNote: Parity blocks the connection from browser extensions like Metamask. To resolve this problem, go to https://framework.embarklabs.io/docs/blockchain_configuration.html#Using-Parity-and-Metamask", "font-size: 2em");
          }
        }
      }
      if (accounts) {
        self.blockchainConnector.setDefaultAccount(accounts[0]);
      }

      doneCb();
    });
  });
};

// See https://eips.ethereum.org/EIPS/eip-1102
Blockchain.enableEthereum = async function() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('ethereum not available in this browser');
  }

  await ethereum.enable();
  this.blockchainConnector.setProvider(ethereum);

  const accounts = await this.blockchainConnector.getAccounts();
  this.blockchainConnector.setDefaultAccount(accounts[0]);

  contracts.forEach(contract => {
    contract.options.from = this.blockchainConnector.getDefaultAccount();
  });

  return accounts;
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

function Contract(options) {
  var self = this;
  var ContractClass;

  this.abi = options.abi || options.abiDefinition;
  this.address = options.address || options.deployedAddress;
  this.gas = options.gas;
  this.code = utils.hexPrefix(options.code);

  this.blockchainConnector = Blockchain.blockchainConnector;

  ContractClass = this.blockchainConnector.newContract({abi: this.abi, address: this.address});
  contracts.push(ContractClass);
  ContractClass.options.data = this.code;
  const from = this.from || self.blockchainConnector.getDefaultAccount();
  if (from) {
    ContractClass.options.from = from;
  }
  ContractClass.abi = ContractClass.options.abi;
  ContractClass.address = this.address;
  ContractClass.gas = this.gas;
  ContractClass.bytecode = '0x' + options.code;
  ContractClass.runtime_bytecode = '0x' + options.runtime_bytecode;
  ContractClass.real_runtime_bytecode = '0x' + options.real_runtime_bytecode;

  let originalMethods = Object.keys(ContractClass);

  Blockchain.execWhenReady(function() {
    if (!ContractClass.currentProvider) {
      ContractClass.setProvider(self.blockchainConnector.getCurrentProvider());
    }
    ContractClass.options.from = self.blockchainConnector.getDefaultAccount();
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

  // Assign helpers too
  for(const method of ["new", "at", "send", "deployed"]) {
    // Make sure we don't override original methods here.
    if (originalMethods.includes(method)) {
      console.log(method + " is a reserved word and will not be aliased as a helper");
      continue;
    }

    ContractClass[method] = Contract.prototype[method].bind(this);
  }

  this.contractClass = ContractClass;

  return ContractClass;
}

Contract.prototype.new = function(args, _options, _txOptions) {
  const self = this;
  const options = Object.assign({
    arguments: args || [],
    data: this.code
  }, _options);

  const txOptions = Object.assign({
    from: this.blockchainConnector.getDefaultAccount(),
    gas: this.gas
  }, _txOptions);

  const contract = this.blockchainConnector.newContract({abi: this.abi});

  this._deployPromise = new Promise((resolve, reject) => {
    contract.deploy.apply(contract, [options]).send(txOptions).then(instance => {
      resolve(new Contract({
        abi: self.abi,
        code: self.code,
        address: instance.options.address
      }));

      // Delete the deploy promise as we don't need to track it anymore.
      delete self._deployPromise;
    }).catch(reject);
  });

  return this._deployPromise;
};

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

Contract.prototype.deployed = function() {
  // This API exists just for compatibility reasons, so it works with tools that
  // don't have their Smart Contracts deployed initially a the time of importing
  // them, like Embark does.
  return Promise.resolve(this);
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
