/* global ethereum*/
import { reduce } from 'async';
let EmbarkJS = global.EmbarkJS || require('embarkjs');
EmbarkJS = EmbarkJS.default || EmbarkJS;
const ENSFunctions = require('./ENSFunctions').default;
const Web3 = require('web3');
const namehash = require('eth-ens-namehash');

const __embarkENS = {};

__embarkENS.ENSFunctions = ENSFunctions;

// resolver interface
__embarkENS.resolverInterface = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "addr",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "content",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      }
    ],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "setAddr",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "setContent",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "name",
        "type": "string"
      }
    ],
    "name": "setName",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "contentType",
        "type": "uint256"
      }
    ],
    "name": "ABI",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "type": "function"
  }
];

const defaultAccountNotSetError = 'web3.eth.defaultAccount not set';
const providerNotSetError = 'ENS provider not set';
const NoDecodeAddrError = 'Error: Couldn\'t decode address from ABI: 0x';
const NoDecodeStringError = 'ERROR: The returned value is not a convertible string: 0x0';
const reverseAddrSuffix = '.addr.reverse';
const voidAddress = '0x0000000000000000000000000000000000000000';

__embarkENS.registryAddresses = {
  // Mainnet
  "1": "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  // Ropsten
  "3": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
  // Rinkeby
  "4": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
};

function setProvider(web3, kind, endpoint) {
  web3.setProvider(new Web3.providers[kind](endpoint));
}

function connectWebSocket(web3, endpoint, callback) {
  setProvider(web3, 'WebsocketProvider', endpoint);
  checkConnection(web3, callback);
}

function connectHttp(web3, endpoint, callback) {
  setProvider(web3, 'HttpProvider', endpoint);
  checkConnection(web3, callback);
}

async function connectWeb3(web3, callback) {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      if (this.dappAutoEnable) {
        await ethereum.enable();
      }
      web3.setProvider(ethereum);
      return checkConnection(callback);
    } catch (e) {
      return callback(null, {
        error: e,
        connected: false
      });
    }
  }
  callback(null, {
    connected: false,
    error: new Error("web3 provider not detected")
  });
}

function checkConnection(web3, callback) {
  web3.eth.getAccounts(error => {
    if (error) {
      web3.setProvider(null);
    }
    callback(null, {
      connected: !error,
      error
    });
  });
}

__embarkENS.web3 = new Web3();

__embarkENS.setProvider = function(config) {
  const ERROR_MESSAGE = 'ENS is not available in this chain';
  this.registration = config.registration;
  this.ready = false;
  this.dappAutoEnable = config.dappAutoEnable;

  reduce(config.dappConnection, false, (result, connectionString, next) => {
    if (result.connected) {
      return next(null, result);
    }

    if (connectionString === '$WEB3') {
      connectWeb3(this.web3, next);
    } else if ((/^wss?:\/\//).test(connectionString)) {
      connectWebSocket(this.web3, connectionString, next);
    } else {
      connectHttp(this.web3, connectionString, next);
    }
  }, async (err, result) => {
    if (result.error) {
      console.error(result.error);
    }
    try {
      const accounts = await this.web3.eth.getAccounts();
      this.web3.eth.defaultAccount = accounts[0];
      const id = await this.web3.eth.net.getId();
      this.isKnownNetwork = !!this.registryAddresses[id];
      const registryAddress = this.registryAddresses[id] || config.registryAddress;
      this._isAvailable = true;
      this.ens = new this.web3.eth.Contract(config.registryAbi, registryAddress);
      this.registrar = new this.web3.eth.Contract(config.registrarAbi, config.registrarAddress);
      this.resolver = new this.web3.eth.Contract(config.resolverAbi, config.resolverAddress);
      this.ready = true;
    } catch (e) {
      this.ready = true;
      if (e.message.indexOf('Provider not set or invalid') > -1) {
        console.warn(ERROR_MESSAGE);
        return;
      }
      console.error(e);
    }
  });
};

__embarkENS.waitForProviderReady = function() {
  return new Promise((resolve, reject) => {
    const self = this;
    function checkReady() {
      if (self.ready === undefined) {
        return reject(providerNotSetError);
      }
      if (self.ready) {
        if (!self.ens) {
          return reject(providerNotSetError);
        }
        return resolve();
      }
      setTimeout(checkReady, 100);
    }
    checkReady();
  });
};

__embarkENS.resolve = function (name, callback) {
  const resolve = async (name) => {
    await this.waitForProviderReady();
    if (!this.web3.eth.defaultAccount) {
      throw new Error(defaultAccountNotSetError);
    }

    let node = namehash.hash(name);

    try {
      const resolvedAddress = await this.ens.methods.resolver(node).call();
      if (resolvedAddress === voidAddress) {
        throw new Error('Name not yet registered');
      }
      const resolverContract = new this.web3.eth.Contract(this.resolverInterface, resolvedAddress);
      return await resolverContract.methods.addr(node).call();
    } catch (err) {
      const msg = err.message;
      if (msg === NoDecodeAddrError) {
        throw new Error(`${name} is not registered`);
      }
      throw err;
    }
  };

  if (callback) {
    resolve(name).then((result) => {
      callback(null, result);
    }).catch(callback);
    return;
  }
  return resolve(name);
};

__embarkENS.lookup = function (address, callback) {
  const lookup = async (address) => {
    await this.waitForProviderReady();
    if (!this.web3.eth.defaultAccount) {
      throw new Error(defaultAccountNotSetError);
    }
    if (address.startsWith("0x")) {
      address = address.slice(2);
    }

    let node = namehash.hash(address.toLowerCase() + reverseAddrSuffix);

    try {
      const resolverAddress = await this.ens.methods.resolver(node).call();
      if (resolverAddress === voidAddress) {
        throw new Error('Address not associated to a resolver');
      }
      const resolverContract = new this.web3.eth.Contract(this.resolverInterface, resolverAddress);
      return await resolverContract.methods.name(node).call();
    } catch (err) {
      const msg = err.message;
      if (msg === NoDecodeStringError || msg === NoDecodeAddrError) {
        throw new Error('Address does not resolve to name. Try syncing chain.');
      }
      throw err;
    }
  };

  if (callback) {
    lookup(address).then((result) => {
      callback(null, result);
    }).catch(callback);
    return;
  }
  return lookup(address);
};

__embarkENS.registerSubDomain = function (name, address, callback) {
  callback = callback || function () {};

  if (!this.web3.eth.defaultAccount) {
    return callback(defaultAccountNotSetError);
  }

  if (this.isKnownNetwork) {
    return callback('Sub-domain registration is only available in development or privatenet mode');
  }
  if (!this.registration || !this.registration.rootDomain) {
    return callback('No rootDomain is declared in config/namesystem.js (register.rootDomain). Unable to register a subdomain until then.');
  }
  if (!address || !Web3.utils.isAddress(address)) {
    return callback('You need to specify a valid address for the subdomain');
  }

  // Register function generated by the index
  ENSFunctions.registerSubDomain(
    this.web3,
    this.ens,
    this.registrar,
    this.resolver,
    this.web3.eth.defaultAccount,
    name,
    this.registration.rootDomain,
    namehash.hash(address.toLowerCase().substr(2) + reverseAddrSuffix),
    address,
    console,
    EmbarkJS.Utils.secureSend,
    (err, result) => {
      if (err && err.indexOf('Transaction has been reverted by the EVM') > -1) {
        return callback('Registration was rejected. Are you the owner of the root domain?');
      }
      callback(err, result);
    });
};

__embarkENS.isAvailable = function () {
  return Boolean(this._isAvailable);
};

export default __embarkENS;
