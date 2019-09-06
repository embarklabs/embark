import async from 'async';
const {__} = require('embark-i18n');
const Web3RequestManager = require('web3-core-requestmanager');

import BlockchainAPI from "./api";
class Blockchain {

  constructor(embark) {
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractConfig = embark.config.contractConfig;
    this.blockchainApi = new BlockchainAPI(embark);


    embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, startCb) => {
      this.blockchainNodes[clientName] = startCb;
    });

    this.events.setCommandHandler("blockchain:node:start", async (blockchainConfig, cb) => {
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
          this.events.emit("blockchain:started");
          return cb(null, true);
        }
        const clientName = blockchainConfig.client;
        const client = this.blockchainNodes[clientName];
        if (!client) return cb("client " + clientName + " not found");

        let onStart = () => {
          this.events.emit("blockchain:started", clientName);
          cb();
        };

        client.apply(client, [onStart]);
      });
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

}

module.exports = Blockchain;
