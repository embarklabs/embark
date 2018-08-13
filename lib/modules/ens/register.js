/*global web3*/
const namehash = require('eth-ens-namehash');

function registerSubDomain(ens, registrar, resolver, defaultAccount, subdomain, rootDomain, reverseNode, address, logger, secureSend, callback) {
  const subnode = namehash.hash(subdomain);
  const node = namehash.hash(`${subdomain}.${rootDomain}`);
  const toSend = registrar.methods.register(subnode, defaultAccount);
  let transaction;


  secureSend(web3, toSend, {from: defaultAccount})
    // Set resolver for the node
    .then(transac => {
      if (transac.status !== "0x1" && transac.status !== "0x01" && transac.status !== true) {
        logger.warn('Failed transaction', transac);
        return callback('Failed to register. Check gas cost.');
      }
      transaction = transac;
      return secureSend(web3, ens.methods.setResolver(node, resolver.options.address), {from: defaultAccount});
    })
    // Set address for node
    .then(_result => {
      return secureSend(web3, resolver.methods.setAddr(node, address), {from: defaultAccount});
    })
    // Set resolver for the reverse node
    .then(_result => {
      return secureSend(web3, ens.methods.setResolver(reverseNode, resolver.options.address), {from: defaultAccount});
    })
    // Set name for reverse node
    .then(_result => {
      return secureSend(web3, resolver.methods.setName(reverseNode, subdomain + '.embark.eth'), {from: defaultAccount});
    })
    .then(_result => {
      callback(null, transaction);
    })
    .catch(err => {
      logger.error(err);
      callback('Failed to register with error: ' + (err.message || err));
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = registerSubDomain;
}
