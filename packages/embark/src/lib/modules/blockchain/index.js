import async from 'async';
const {__} = require('embark-i18n');
const constants = require('embark-core/constants');
const Web3RequestManager = require('web3-core-requestmanager');

import BlockchainAPI from "./api";
class Blockchain {

  constructor(embark, options) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractConfig = embark.config.contractConfig;
    this.blockchainApi = new BlockchainAPI(embark);
    this.startedClient = null;
    this.plugins = options.plugins;

    this.registerConsoleCommands();

    embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, startCb) => {
      this.blockchainNodes[clientName] = startCb;
    });

    this.events.setCommandHandler("blockchain:node:start", async (initialBlockchainConfig, cb) => {
      this.plugins.emitAndRunActionsForEvent("blockchain:config:modify", initialBlockchainConfig, (err, blockchainConfig) => {
        if (err) {
          this.logger.error(__('Error getting modified blockchain config: %s', err.message || err));
          blockchainConfig = initialBlockchainConfig;
        }
        const self = this;
        const clientName = blockchainConfig.client;
        function started() {
          self.startedClient = clientName;
          self.events.emit("blockchain:started", clientName);
        }
        if (clientName === constants.blockchain.vm) {
          started();
          return cb();
        }
        const requestManager = new Web3RequestManager.Manager(blockchainConfig.endpoint);

        const ogConsoleError = console.error;
        // TODO remove this once we update to web3 2.0
        // TODO in web3 1.0, it console.errors "connection not open on send()" even if we catch the error
        console.error = (...args) => {
          if (args[0].indexOf('connection not open on send()') > -1) {
            return;
          }
          ogConsoleError(...args);
        };
        requestManager.send({method: 'eth_accounts'}, (err, _accounts) => {
          console.error = ogConsoleError;
          if (!err) {
            // Node is already started
            started();
            return cb(null, true);
          }
          const clientFunctions = this.blockchainNodes[clientName];
          if (!clientFunctions) {
            return cb(__("Client %s not found in registered plugins", clientName));
          }

          let onStart = () => {
            started();
            cb();
          };

          this.startedClient = clientName;
          clientFunctions.launchFn.apply(clientFunctions, [onStart]);

        });
      });
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
        return cb(__("Client %s not found in registered plugins", clientName));
      }

      clientFunctions.stopFn.apply(clientFunctions, [
        () => {
          this.events.emit("blockchain:stopped", clientName);
          cb();
        }
      ]);
      this.startedClient = null;
    });
    this.blockchainApi.registerAPIs("ethereum");
    this.blockchainApi.registerRequests("ethereum");
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
          provider: contractsConfig.library || 'web3',
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

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      matches: ['log blockchain on'],
      process: (cmd, callback) => {
        this.events.request('logs:ethereum:enable', callback);
      }
    });
    this.embark.registerConsoleCommand({
      matches: ['log blockchain off'],
      process: (cmd, callback) => {
        this.events.request('logs:ethereum:disable', callback);
      }
    });
  }
}

module.exports = Blockchain;
