const namehash = require('eth-ens-namehash');

function registerSubDomain(ens, registrar, resolver, defaultAccount, subdomain, rootDomain, reverseNode, address, callback) {
  console.log('Register', arguments);
  const subnode = namehash.hash(subdomain);
  const node = namehash.hash(`${subdomain}.${rootDomain}`);
  const toSend = registrar.methods.register(subnode, defaultAccount);
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
      return ens.methods.setResolver(node, resolver.options.address).send();
    })
    // Set address for node
    .then(_result => {
      return resolver.methods.setAddr(node, address).send();
    })
    // Set resolver for the reverse node
    .then(_result => {
      return ens.methods.setResolver(reverseNode, resolver.options.address).send();
    })
    // Set name for reverse node
    .then(_result => {
      return resolver.methods.setName(reverseNode, subdomain + '.embark.eth').send();
    })
    .then(_result => {
      callback(null, transaction);
    })
    .catch(err => {
      callback('Failed to register with error: ' + (err.message || err));
      console.error(err);
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = registerSubDomain;
}
