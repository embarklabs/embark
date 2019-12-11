import async from 'async';
const { __ } = require('embark-i18n');
const constants = require('embark-core/constants');

import BlockchainAPI from "./api";
export default class Blockchain {

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

    if (options.ipc.isServer()) {
      options.ipc.on('blockchain:node', (_message, cb) => {
        cb(null, this.blockchainConfig.endpoint);
      });
    }

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, { isStartedFn, launchFn, stopFn }) => {

      if (!isStartedFn) {
        throw new Error(`Blockchain client '${clientName}' must be registered with an 'isStarted' function, client not registered.`);
      }
      if (!launchFn) {
        throw new Error(`Blockchain client '${clientName}' must be registered with a 'launchFn' function, client not registered.`);
      }
      if (!stopFn) {
        throw new Error(`Blockchain client '${clientName}' must be registered with a 'stopFn' function, client not registered.`);
      }

      this.blockchainNodes[clientName] = { isStartedFn, launchFn, stopFn };
    });

    this.events.setCommandHandler("blockchain:node:start", (blockchainConfig, cb) => {
      if (!blockchainConfig.enabled) {
        return cb();
      }

      const clientName = blockchainConfig.client;
      const started = () => {
        this.startedClient = clientName;
        this.events.emit("blockchain:started", clientName);
      };
      if (clientName === constants.blockchain.vm) {
        started();
        return cb();
      }

      const client = this.blockchainNodes[clientName];

      if (!client) return cb(`Blockchain client '${clientName}' not found, please register this node using 'blockchain:node:register'.`);

      // check if we should should start
      client.isStartedFn.call(client, (err, isStarted) => {
        if (err) {
          return cb(err);
        }
        if (isStarted) {
          // Node may already be started
          started();
          return cb(null, true);
        }
        // start node
        client.launchFn.call(client, () => {
          started();
          cb();
        });
      });
    });

    this.events.setCommandHandler("blockchain:node:stop", (clientName, cb) => {
      if (typeof clientName === 'function') {
        cb = clientName;
        clientName = this.startedClient;
        if (!this.startedClient) {
          return cb(__('No blockchain client is currently started'));
        }
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
    if (!this.blockchainConfig.enabled) {
      cb();
    }
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
        const config = {
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
