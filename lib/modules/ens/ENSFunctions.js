const namehash = require('eth-ens-namehash');

const reverseAddrSuffix = '.addr.reverse';
const voidAddress = '0x0000000000000000000000000000000000000000';
const NoDecodeAddrError = 'Error: Couldn\'t decode address from ABI: 0x';
const NoDecodeStringError = 'ERROR: The returned value is not a convertible string: 0x0';

function registerSubDomain(ens, registrar, resolver, defaultAccount, subdomain, rootDomain, reverseNode, address, logger, callback) {
  const subnode = namehash.hash(subdomain);
  const node = namehash.hash(`${subdomain}.${rootDomain}`);
  const toSend = registrar.methods.register(subnode, defaultAccount);
  let transaction;

  toSend.estimateGas()
  // Register domain
    .then(gasEstimated => {
      return toSend.send({gas: gasEstimated + 1000, from: defaultAccount});
    })
    // Set resolver for the node
    .then(transac => {
      if (transac.status !== "0x1" && transac.status !== "0x01" && transac.status !== true) {
        logger.warn('Failed transaction', transac);
        return callback('Failed to register. Check gas cost.');
      }
      transaction = transac;
      return ens.methods.setResolver(node, resolver.options.address).send({from: defaultAccount});
    })
    // Set address for node
    .then(_result => {
      return resolver.methods.setAddr(node, address).send({from: defaultAccount});
    })
    // Set resolver for the reverse node
    .then(_result => {
      return ens.methods.setResolver(reverseNode, resolver.options.address).send({from: defaultAccount});
    })
    // Set name for reverse node
    .then(_result => {
      return resolver.methods.setName(reverseNode, subdomain + '.embark.eth').send({from: defaultAccount});
    })
    .then(_result => {
      callback(null, transaction);
    })
    .catch(err => {
      logger.error(err);
      callback('Failed to register with error: ' + (err.message || err));
    });
}

function lookupAddress(address, ens, utils, createResolverContract, callback) {
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }

  let node = utils.soliditySha3(address.toLowerCase() + reverseAddrSuffix);

  function cb(err, name) {
    if (err === NoDecodeStringError || err === NoDecodeAddrError) {
      return callback('Address does not resolve to name. Try syncing chain.');
    }
    return callback(err, name);
  }

  return ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === voidAddress) {
      return cb('Address not associated to a resolver');
    }
    createResolverContract(resolverAddress, (_, resolverContract) => {
      resolverContract.methods.name(node).call(cb);
    });

  });
}

function resolveName(name, ens, createResolverContract, callback) {
  let node = namehash.hash(name);

  function cb(err, addr) {
    if (err === NoDecodeAddrError) {
      return callback(name + " is not registered", "0x");
    }
    callback(err, addr);
  }

  return ens.methods.resolver(node).call((err, resolverAddress) => {
    if (err) {
      return cb(err);
    }
    if (resolverAddress === voidAddress) {
      return cb('Name not yet registered');
    }
    createResolverContract(resolverAddress, (_, resolverContract) => {
      resolverContract.methods.addr(node).call(cb);
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerSubDomain,
    resolveName,
    lookupAddress
  };
}
;
