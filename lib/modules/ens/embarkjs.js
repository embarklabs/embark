/*global EmbarkJS, web3, registerSubDomain, namehash*/

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
    web3.eth.net.getId()
      .then((id) => {
      const registryAddress = self.registryAddresses[id] || config.registryAddress;
      self.isAvailable = true;
      self.ens = new EmbarkJS.Contract({abi: config.registryAbi, address: registryAddress});
      self.registrar = new EmbarkJS.Contract({abi: config.registrarAbi, address: config.registrarAddress});
      self.resolver = new EmbarkJS.Contract({abi: config.resolverAbi, address: config.resolverAddress});
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
  callback = callback || function () {};
  if (!this.ens) {
    return callback(providerNotSetError);
  }
  let node = namehash.hash(name);

  function cb(err, addr) {
    if (err === NoDecodeAddrError) {
      return callback(name + " is not registered", "0x");
    }
    callback(err, addr);
  }

  return this.ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === voidAddress) {
      return cb('Name not yet registered');
    }
    let resolverContract = new EmbarkJS.Contract({abi: this.resolverInterface, address: resolverAddress});
    resolverContract.methods.addr(node).call(cb);
  });
};

__embarkENS.lookup = function (address, callback) {
  callback = callback || function () {};
  if (!this.ens) {
    return callback(providerNotSetError);
  }
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }
  let node = web3.utils.soliditySha3(address.toLowerCase() + reverseAddrSuffix);

  function cb(err, name) {
    if (err === NoDecodeStringError || err === NoDecodeAddrError) {
      return callback('Address does not resolve to name. Try syncing chain.');
    }
    return callback(err, name);
  }

  return this.ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === voidAddress) {
      return cb('Address not associated to a resolver');
    }
    let resolverContract = new EmbarkJS.Contract({abi: this.resolverInterface, address: resolverAddress});
    resolverContract.methods.name(node).call(cb);
  });
};

__embarkENS.registerSubDomain = function (name, address, callback) {
  callback = callback || function () {};

  if (this.env !== 'development') {
    return callback('Sub-domain registration is only available in development mode');
  }
  if (!this.registration || !this.registration.rootDomain) {
    return callback('No rootDomain is declared in config/namesystem.js (register.rootDomain). Unable to register a subdomain until then.');
  }
  if (!address || !web3.utils.isAddress(address)) {
    return callback('You need to specify a valid address for the subdomain');
  }

  // Register function generated by the index
  registerSubDomain(this.ens, this.registrar, this.resolver, web3.eth.defaultAccount, name, this.registration.rootDomain,
    web3.utils.soliditySha3(address.toLowerCase().substr(2) + reverseAddrSuffix), address, console, callback);
};

__embarkENS.isAvailable = function () {
  return Boolean(this.isAvailable);
};
