
class BlockchainClient {

  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;

    this.blockchainClients = {};
    this.client = null;
    this.events.setCommandHandler("blockchain:client:register", (clientName, blockchainClient) => {
      this.blockchainClients[clientName] = blockchainClient;
      this.client = blockchainClient;
    })

    // TODO: maybe not the ideal event to listen to?
    // for e.g, could wait for all stack components to be ready
    // TODO: probably better to have 2 stages in engine, services start, then connections, etc..
    this.events.on("blockchain:started", (clientName) => {
      // make connections
      // this.client.initAndConnect(); // and config options
      // should do stuff like
      // connect to endpoint given
      // set default account
    })



  }

}

module.exports = BlockchainClient;
