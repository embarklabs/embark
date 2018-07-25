/*global EmbarkJS, web3*/

import namehash from 'eth-ens-namehash';

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
  EmbarkJS.onReady(() => {
    self.registration = config.registration;

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
    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
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
  let node = web3.utils.soliditySha3(address.toLowerCase() + ".addr.reverse");

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
    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      return cb('Address not associated to a resolver');
    }
    let resolverContract = new EmbarkJS.Contract({abi: this.resolverInterface, address: resolverAddress});
    resolverContract.methods.name(node).call(cb);
  });
};

__embarkENS.registerSubDomain = function (name, address, callback) {
  const self = this;
  callback = callback || function () {};

  // TODO do something when no address
  const resolveAddr = address || '0x0000000000000000000000000000000000000000';
  const subnode = namehash.hash(name);
  const node = namehash.hash(`${name}.${self.registration.rootDomain}`);
  const reverseNode = web3.utils.soliditySha3(resolveAddr.toLowerCase().substr(2) + '.addr.reverse');
  const toSend = this.registrar.methods.register(subnode, web3.eth.defaultAccount);
  let transaction;

  toSend.estimateGas()
    // Register domain
    .then(gasEstimated => {
      return toSend.send({gas: gasEstimated + 1000});
    })
    // Set resolver for the node
    .then(transac => {
      if (transac.status !== "0x1" && transac.status !== "0x01") {
        console.warn('Failed transaction', transac);
        return callback('Failed to register. Check gas cost.');
      }
      transaction = transac;
      return self.ens.methods.setResolver(node, self.resolver.options.address).send();
    })
    // Set address for node
    .then(_result => {
      return self.resolver.methods.setAddr(node, resolveAddr).send();
    })
    // Set resolver for the reverse node
    .then(_result => {
      return self.ens.methods.setResolver(reverseNode, self.resolver.options.address).send();
    })
    // Set name for reverse node
    .then(_result => {
      return self.resolver.methods.setName(reverseNode, name + '.embark.eth').send();
    })
    .then(_result => {
      callback(null, transaction);
    })
    .catch(err => {
      callback('Failed to register with error: ' + (err.message || err));
      console.error(err);
    });
};

__embarkENS.isAvailable = function () {
  return Boolean(this.isAvailable);
};
