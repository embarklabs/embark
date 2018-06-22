import namehash from 'eth-ens-namehash';

/*global web3*/
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

__embarkENS.setProvider = function (config) {
  const self = this;
  EmbarkJS.onReady(() => {
    self.ens = new EmbarkJS.Contract({abi: config.abi, address: config.address});
  });
};

__embarkENS.resolve = function (name) {
  const self = this;

  if (self.ens === undefined) return;

  let node = namehash.hash(name);
  
  return self.ens.methods.resolver(node).call().then((resolverAddress) => {
    let resolverContract = new EmbarkJS.Contract({abi: self.resolverInterface, address: resolverAddress});
    return resolverContract.methods.addr(node).call();
  }).then((addr) => {
    return addr;
  }).catch(err => err);
};

__embarkENS.lookup = function (address) {
  const self = this;

  if (!self.ens) {
    console.log("ENS provider not set. Exiting.");
    return;
  }
  if (address.startsWith("0x")) address = address.slice(2);

  let node = namehash.hash(address.toLowerCase() + ".addr.reverse");

  return self.ens.methods.resolver(node).call().then((resolverAddress) => {
    let resolverContract = new EmbarkJS.Contract({abi: self.resolverInterface, address: resolverAddress});
    return resolverContract.methods.name(node).call();
  }).catch(err => err);
};
