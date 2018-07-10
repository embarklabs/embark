import namehash from 'eth-ens-namehash';

/*global web3, EmbarkJS*/
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
    "constant": true,
    "inputs": [
      {
        "name": "node",
        "type": "bytes32"
      },
      {
        "name": "kind",
        "type": "bytes32"
      }
    ],
    "name": "has",
    "outputs": [
      {
        "name": "",
        "type": "bool"
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

__embarkENS.registryAddresses = {
  // Mainnet
  "1": "0x314159265dd8dbb310642f98f50c066173c1259b",
  // Ropsten
  "3": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
  // Rinkeby
  "4": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A"
};

const providerNotSetError = 'ENS provider not set';
const NoDecodeAddrError = 'Error: Couldn\'t decode address from ABI: 0x';
const NoDecodeStringError = 'ERROR: The returned value is not a convertible string: 0x0';

__embarkENS.setProvider = function () {
  const self = this;
  // get network id and then assign ENS contract based on that 
  let registryAddresses = this.registryAddresses;
  this.ens = null;
  web3.eth.net.getId().then(id => {
    if (registryAddresses[id] !== undefined) {
      EmbarkJS.onReady(() => {
        self.ens = new EmbarkJS.Contract({abi: self.registryInterface, address: registryAddresses[id]});
      });
    }
    // todo: deploy at this point
  }).catch(e => {
    if (e.message.indexOf('Provider not set or invalid') > -1) {
      console.warn('ENS is not available in this chain');
      return;
    }
    console.error(e);
  });
};

__embarkENS.resolve = function (name, callback) {
  if (!this.ens) {
    return callback(providerNotSetError);
  }

  let node = namehash.hash(name);

  console.log('Name to check', name);
  console.log('Node', node);
  console.log(this.ens);
  return this.ens.methods.resolver(node).call().then((resolverAddress) => {
    console.log('address', resolverAddress);
    let resolverContract = new EmbarkJS.Contract({abi: this.resolverInterface, address: resolverAddress});
    return resolverContract.methods.addr(node).call()
      .then((addr) => {
        console.log('ADRESSS', addr);
        callback(null, addr);
      })
      .catch(err => {
        if (err === NoDecodeAddrError) {
          return callback(name + " is not registered", "0x");
        }
        callback(err);
      });
  }).catch((err) => {
    if (err === NoDecodeAddrError) {
      return callback(name + " is not registered", "0x");
    }
    console.log('oldekwe^pfke');
    callback(err);
  });
};

__embarkENS.lookup = function (address, callback) {
  if (!this.ens) {
    return callback(providerNotSetError);
  }
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }
  console.log('Address', address);
  let node = namehash.hash(address.toLowerCase() + ".addr.reverse");
  console.log('Node', node);

  return this.ens.methods.resolver(node).call().then((resolverAddress) => {
    console.log('Resolver address', resolverAddress);
    let resolverContract = new EmbarkJS.Contract({abi: this.resolverInterface, address: resolverAddress});
    resolverContract.methods.name(node).call()
      .then(name => {
        console.log('Name');
        callback(null, name);
      })
      .catch(callback);
  }).catch((err) => {
    console.log('Got error', err);
    if (err === NoDecodeStringError || err === NoDecodeAddrError) {
      console.log('Address does not resolve to name. Try syncing chain.');
      return "";
    }
    return err;
  });
};
