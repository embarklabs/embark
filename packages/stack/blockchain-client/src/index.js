const Web3 = require('web3');
const { __ } = require('embark-i18n');
const constants = require('embark-core/constants');

class BlockchainClient {

  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;
    this.config = embark.config;

    this.vms = [];
    this.events.setCommandHandler("blockchain:vm:register", (name, handler) => {
      this.vms.push({name, handler: handler()});
    });

    this.events.setCommandHandler("blockchain:client:vmProvider", async (vmName, cb) => {
      if (typeof vmName === 'function') {
        cb = vmName;
        vmName = '';
      }
      if (!this.vms.length) {
        return cb(`Failed to get the VM provider. Please register one using 'blockchain:vm:register', or by ensuring the 'embark-ganache' package is registered.`);
      }
      if (vmName) {
        const vm = this.getVmClient(vmName);
        if (!vm) {
          return cb(__("No VM of name %s registered. Please register it using using 'blockchain:vm:register'", vmName));
        }
        return cb(null, vm.handler);
      }
      return cb(null, this.vms[this.vms.length - 1].handler);
    });

    this.blockchainClients = {};
    this.client = null;
    this.events.setCommandHandler("blockchain:client:register", (clientName, blockchainClient) => {
      this.blockchainClients[clientName] = blockchainClient;
      this.client = blockchainClient;
    });

    this.events.setCommandHandler("blockchain:client:provider", async (clientName, endpoint, cb) => {
      if (!cb && typeof endpoint === "function") {
        cb = endpoint;
        endpoint = null;
      }
      let provider;
      try {
        provider = await this._getProvider(clientName, endpoint);
      }
      catch (err) {
        return cb(`Error getting provider: ${err.message || err}`);
      }
      cb(null, provider);
    });
  }

  getVmClient(vmName) {
    return this.vms.find(vm => vm.name === vmName);
  }

  async _getProvider(clientName, endpoint) {
    const blockchainClientName = this.config.blockchainConfig.client;
    if (endpoint && this.getVmClient(blockchainClientName)) {
      // TODO find a fix to detect if it 's the proxy
      // Currently using a VM instead of a Node
      const vm = await this.events.request2('blockchain:client:vmProvider', blockchainClientName);
      return vm;
    }
    // Passing in an endpoint allows us to customise which URL the provider connects to.
    // If no endpoint is provided, the provider will connect to the proxy.
    // Explicity setting an endpoint is useful for cases where we want to connect directly
    // to the node (ie in the proxy).
    if (!endpoint) {
      // will return the proxy URL
      endpoint = await this.events.request2("proxy:endpoint:get");
    }
    if (endpoint.startsWith('ws')) {
      return new Web3.providers.WebsocketProvider(endpoint, {
        headers: { Origin: constants.embarkResourceOrigin },
        // TODO remove this when Geth fixes this: https://github.com/ethereum/go-ethereum/issues/16846
        //  Edit: This has been fixed in Geth 1.9, but we don't support 1.9 yet and still support 1.8
        clientConfig: {
          fragmentationThreshold: 81920
        }
      });
    }
    const web3 = new Web3(endpoint);
    return web3.currentProvider;
  }
}

module.exports = BlockchainClient;
