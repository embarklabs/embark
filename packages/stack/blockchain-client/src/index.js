const Web3 = require('web3');
const constants = require('embark-core/constants');

class BlockchainClient {

  constructor(embark, _options) {
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
        if (endpoint.startsWith('ws')) {
          return cb(null, new Web3.providers.WebsocketProvider(endpoint, {
            headers: {Origin: constants.embarkResourceOrigin},
            // TODO remove this when Geth fixes this: https://github.com/ethereum/go-ethereum/issues/16846
            //  Edit: This has been fixed in Geth 1.9, but we don't support 1.9 yet and still support 1.8
            clientConfig: {
              fragmentationThreshold: 81920
            }
          }));
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
