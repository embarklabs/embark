import async from 'async';
const {__} = require('embark-i18n');
const constants = require('embark-core/constants');

class Blockchain {

  constructor(embark, options) {
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractConfig = embark.config.contractConfig;
    this.plugins = options.plugins;
    let plugin = this.plugins.createPlugin('web3plugin', {});
    this.startedClient = null;

    plugin.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, startCb) => {
      this.blockchainNodes[clientName] = startCb;
    });

    this.events.setCommandHandler("blockchain:node:start", (blockchainConfig, cb) => {
      const clientName = blockchainConfig.client;
      if (clientName === constants.blockchain.vm) {
        this.startedClient = clientName;
        this.events.emit("blockchain:started", clientName);
        return cb();
      }
      const clientFunctions = this.blockchainNodes[clientName];
      if (!clientFunctions) {
        return cb(__("Client %s not found", clientName));
      }

      let onStart = () => {
        this.events.emit("blockchain:started", clientName);
        cb();
      };

      this.startedClient = clientName;
      clientFunctions.launchFn.apply(clientFunctions, [onStart]);
    });

    this.events.setCommandHandler("blockchain:node:stop", (clientName, cb) => {
      if (typeof clientName === 'function') {
        if (!this.startedClient) {
          return cb(__('No blockchain client is currently started'));
        }
        cb = clientName;
        clientName = this.startedClient;
      }

      if (clientName === constants.blockchain.vm) {
        this.startedClient = null;
        this.events.emit("blockchain:stopped", clientName);
        return cb();
      }

      const clientFunctions = this.blockchainNodes[clientName];
      if (!clientFunctions) {
        return cb(__("Client %s not found", clientName));
      }

      clientFunctions.stopFn.apply(clientFunctions, [
        () => {
          this.events.emit("blockchain:stopped", clientName);
          cb();
        }
      ]);
      this.startedClient = null;
    });
  }

  addArtifactFile(_params, cb) {
    this.events.request("config:contractsConfig", (_err, contractsConfig) => {
      async.map(contractsConfig.dappConnection, (conn, mapCb) => {
        if (conn === '$EMBARK') {
          // Connect to Embark's endpoint (proxy)
          return this.events.request("proxy:endpoint:get", mapCb);
        }
        mapCb(null, conn);
      }, (err, results) => {
        if (err) {
          this.logger.error(__('Error getting dapp connection'));
          return cb(err);
        }
        let config = {
          dappConnection: results,
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
    });
  }

}

module.exports = Blockchain;
