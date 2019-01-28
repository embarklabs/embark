/*global EmbarkJS, Web3, registerSubDomain, namehash*/

let __embarkENS = {};

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
  "1": "0x314159265dd8dbb310642f98f50c066173c1259b",
  // Ropsten
  "3": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
  // Rinkeby
  "4": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
};

__embarkENS.setProvider = function (config) {
  const self = this;
  const ERROR_MESSAGE = 'ENS is not available in this chain';
  self.registration = config.registration;
  self.env = config.env;
  EmbarkJS.onReady(() => {
    EmbarkJS.Blockchain.blockchainConnector.getNetworkId()
      .then((id) => {
        const registryAddress = self.registryAddresses[id] || config.registryAddress;
        self._isAvailable = true;
        self.ens = new EmbarkJS.Blockchain.Contract({
          abi: config.registryAbi,
          address: registryAddress,
          web3: EmbarkJS.Blockchain.blockchainConnector.getInstance()
        });
        self.registrar = new EmbarkJS.Blockchain.Contract({
          abi: config.registrarAbi,
          address: config.registrarAddress,
          web3: EmbarkJS.Blockchain.blockchainConnector.getInstance()
        });
        self.resolver = new EmbarkJS.Blockchain.Contract({
          abi: config.resolverAbi,
          address: config.resolverAddress,
          web3: EmbarkJS.Blockchain.blockchainConnector.getInstance()
        });
      })
      .catch(err => {
        if (err.message.indexOf('Provider not set or invalid') > -1) {
          console.warn(ERROR_MESSAGE);
          return;
        }
        console.error(err);
      });
  });
};

__embarkENS.resolve = function (name, callback) {
  return new Promise((resolve, reject) => {

    function resolveOrReject(err, addr) {
      if (err) {
        if (err === NoDecodeAddrError) {
          err = `${name} is not registered`;
          addr = '0x';
        }
        return !callback ? reject(err) : callback(err);
      }
      return !callback ? resolve(addr) : callback(err, addr);
    }

    if (!this.ens) {
      resolveOrReject(providerNotSetError);
    }
  if (!EmbarkJS.Blockchain.blockchainConnector.getDefaultAccount()) {
      resolveOrReject(defaultAccountNotSetError);
    }

    let node = namehash.hash(name);

    this.ens.methods.resolver(node).call().then(resolvedAddress => {
      if (resolvedAddress === voidAddress) {
        return resolveOrReject('Name not yet registered');
      }
      let resolverContract = new EmbarkJS.Blockchain.Contract({
        abi: this.resolverInterface,
        address: resolvedAddress,
        web3: EmbarkJS.Blockchain.blockchainConnector.getInstance()
      });
      resolverContract.methods.addr(node).call(resolveOrReject);
    }).catch(resolveOrReject);
  });
};

__embarkENS.lookup = function (address, callback) {
  return new Promise((resolve, reject) => {

    function resolveOrReject(err, name) {
      if (err) {
        if (err === NoDecodeStringError || err === NoDecodeAddrError) {
          err = 'Address does not resolve to name. Try syncing chain.';
        }
        return !callback ? reject(err) : callback(err);
      }
      return !callback ? resolve(name) : callback(err, name);
    }

    if (!this.ens) {
      return resolveOrReject(providerNotSetError);
    }

    if (!EmbarkJS.Blockchain.blockchainConnector.getDefaultAccount()) {
      return resolveOrReject(defaultAccountNotSetError);
    }

    if (address.startsWith("0x")) {
      address = address.slice(2);
    }

    let node = Web3.utils.soliditySha3(address.toLowerCase() + reverseAddrSuffix);

    this.ens.methods.resolver(node).call().then(resolverAddress => {
      if (resolverAddress === voidAddress) {
        return resolveOrReject('Address not associated to a resolver');
      }
      const resolverContract = new EmbarkJS.Blockchain.Contract({
        abi: this.resolverInterface,
        address: resolverAddress,
        web3: EmbarkJS.Blockchain.blockchainConnector.getInstance()
      });
      resolverContract.methods.name(node).call(resolveOrReject);
    }).catch(resolveOrReject);
  });
};

__embarkENS.registerSubDomain = function (name, address, callback) {
  callback = callback || function () {};

  if (!EmbarkJS.Blockchain.blockchainConnector.getDefaultAccount()) {
    return callback(defaultAccountNotSetError);
  }

  if (this.env !== 'development' && this.env !== 'privatenet') {
    return callback('Sub-domain registration is only available in development or privatenet mode');
  }
  if (!this.registration || !this.registration.rootDomain) {
    return callback('No rootDomain is declared in config/namesystem.js (register.rootDomain). Unable to register a subdomain until then.');
  }
  if (!address || !Web3.utils.isAddress(address)) {
    return callback('You need to specify a valid address for the subdomain');
  }

  // Register function generated by the index
  registerSubDomain(
    EmbarkJS.Blockchain.blockchainConnector.getInstance(),
    this.ens,
    this.registrar,
    this.resolver,
    EmbarkJS.Blockchain.blockchainConnector.getDefaultAccount(),
    name,
    this.registration.rootDomain,
    Web3.utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix),
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
