
class Blockchain {

  constructor(embark, options) {
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractConfig = embark.config.contractConfig;
    this.plugins = options.plugins;
    let plugin = this.plugins.createPlugin('web3plugin', {});

    plugin.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, startCb) => {
      this.blockchainNodes[clientName] = startCb
    })

    plugin.registerActionForEvent("embark:engine:started", (_params, cb) => {
      const clientName = this.blockchainConfig.client;
      const client = this.blockchainNodes[clientName];
      if (!client) return cb("client " + clientName + " not found");

      client.apply(client, [cb]);
    })
  }

  addArtifactFile(_params, cb) {
    this.events.request("config:contractsConfig", (contractsConfig) => {
      let config = {
        dappConnection: contractsConfig.dappConnection,
        dappAutoEnable: contractsConfig.dappAutoEnable,
        warnIfMetamask: this.blockchainConfig.isDev,
        blockchainClient: this.blockchainConfig.client
      };

      this.events.request("pipeline:register", {
        path: [this.embarkConfig.generationDir, 'config'],
        file: 'blockchain.json',
        format: 'json',
        content: config
      }, cb);
    });
  }

}

module.exports = Blockchain;
