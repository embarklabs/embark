const namehash = require('eth-ens-namehash');

// Price of ENS registration contract functions
const ENS_GAS_PRICE = 700000;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const reverseAddressSuffix = '.addr.reverse';
const NoDecodeAddrErr = 'Error: Couldn\'t decode address from ABI: 0x';
const NoDecodeStringErr = 'ERROR: The returned value is not a convertible string: 0x0';

function registerSubDomain(web3, ens, registrar, resolver, defaultAccount, subdomain, rootDomain, reverseNode, address, logger, secureSend, callback, _namehash) {
  _namehash = _namehash || namehash;
  const subnode = _namehash.hash(subdomain);
  const rootNode = _namehash.hash(rootDomain);
  const node = _namehash.hash(`${subdomain}.${rootDomain}`);
  // FIXME Registrar calls a function in ENS and in privatenet it doesn't work for soem reason
  // const toSend = registrar.methods.register(subnode, defaultAccount);
  const toSend = ens.methods.setSubnodeOwner(rootNode, subnode, defaultAccount);
  let transaction;

  secureSend(web3, toSend, {from: defaultAccount, gas: ENS_GAS_PRICE}, false)
  // Set resolver for the node
    .then(transac => {
      if (transac.status !== "0x1" && transac.status !== "0x01" && transac.status !== true) {
        logger.warn('Failed transaction', transac);
        return callback('Failed to register. Check gas cost.');
      }
      transaction = transac;
      return secureSend(web3, ens.methods.setResolver(node, resolver.options.address), {from: defaultAccount, gas: ENS_GAS_PRICE}, false);
    })
    // Set address for node
    .then(_result => {
      return secureSend(web3, resolver.methods.setAddr(node, address), {from: defaultAccount, gas: ENS_GAS_PRICE}, false);
    })
    // Set resolver for the reverse node
    .then(_result => {
      return secureSend(web3, ens.methods.setResolver(reverseNode, resolver.options.address), {from: defaultAccount, gas: ENS_GAS_PRICE}, false);
    })
    // Set name for reverse node
    .then(_result => {
      return secureSend(web3, resolver.methods.setName(reverseNode, `${subdomain}.${rootDomain}`), {from: defaultAccount, gas: ENS_GAS_PRICE}, false);
    })
    .then(_result => {
      callback(null, transaction);
    })
    .catch(err => {
      logger.error('Failed to register with error:', err.message || err);
      callback(err.message || err);
    });
}

function lookupAddress(address, ens, _namehash, createResolverContract, callback) {
  _namehash = _namehash || namehash;
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }

  let node = _namehash.hash(address.toLowerCase() + reverseAddressSuffix);

  function cb(err, name) {
    if (err === NoDecodeStringErr || err === NoDecodeAddrErr) {
      return callback('Address does not resolve to name. Try syncing chain.');
    }
    return callback(err, name);
  }

  return ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === ZERO_ADDRESS) {
      return cb('Address not associated to a resolver');
    }
    createResolverContract(resolverAddress, (_, resolverContract) => {
      resolverContract.methods.name(node).call(cb);
    });

  });
}

function resolveName(name, ens, createResolverContract, callback, _namehash) {
  _namehash = _namehash || namehash;
  let node = _namehash.hash(name);

  function cb(err, addr) {
    if (err === NoDecodeAddrErr) {
      return callback(name + " is not registered", "0x");
    }
    callback(err, addr);
  }

  return ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === ZERO_ADDRESS) {
      return cb('Name not yet registered');
    }
    createResolverContract(resolverAddress, (_, resolverContract) => {
      resolverContract.methods.addr(node).call(cb);
    });
  });
}

export default {
  registerSubDomain,
  resolveName,
  lookupAddress
};
