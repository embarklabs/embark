const Web3 = require('web3');

class BlockchainClient {

  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;

    this.blockchainClients = {};
    this.client = null;
    this.events.setCommandHandler("blockchain:client:register", (clientName, blockchainClient) => {
      this.blockchainClients[clientName] = blockchainClient;
      this.client = blockchainClient;
    });

    // TODO: unclear currently if this belongs here so it's a bit hardcoded for now
    this.events.setCommandHandler("blockchain:client:provider", (clientName, cb) => {
      this.events.request("proxy:endpoint:get", (err, endpoint) => {
        if (err) {
          return cb(err);
        }
        const web3 = new Web3(endpoint);
        cb(null, web3.currentProvider);
      });
    });

    // TODO: maybe not the ideal event to listen to?
    // for e.g, could wait for all stack components to be ready
    // TODO: probably better to have 2 stages in engine, services start, then connections, etc..
    this.events.on("blockchain:started", (_clientName) => {
      // make connections
      // this.client.initAndConnect(); // and config options
      // should do stuff like
      // connect to endpoint given
      // set default account
    });
  }

}

module.exports = BlockchainClient;
