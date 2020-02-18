import async from 'async';
import { warnIfPackageNotDefinedLocally } from 'embark-utils';
const { __ } = require('embark-i18n');

import BlockchainAPI from "./api";
import Web3 from "web3";
import constants from "embark-core/constants";
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
    this.blockchainClients = {};
    this.warnIfPackageNotDefinedLocally = options.warnIfPackageNotDefinedLocally ?? warnIfPackageNotDefinedLocally;
    this.Web3 = options.Web3 ?? Web3;

    this.registerConsoleCommands();

    embark.registerActionForEvent("pipeline:generateAll:before", this.addArtifactFile.bind(this));

    if (options.ipc.isServer()) {
      options.ipc.on('blockchain:node', (_message, cb) => {
        cb(null, this.blockchainConfig.endpoint);
      });
    }

    this.blockchainNodes = {};
    this.events.setCommandHandler("blockchain:node:register", (clientName, clientFunctions, cb = () => {}) => {
      const {isStartedFn, launchFn, stopFn, provider} = clientFunctions;

      if (!isStartedFn) {
        return cb(`Blockchain client '${clientName}' must be registered with an 'isStarted' function, client not registered.`);
      }
      if (!launchFn) {
        return cb(`Blockchain client '${clientName}' must be registered with a 'launchFn' function, client not registered.`);
      }
      if (!stopFn) {
        return cb(`Blockchain client '${clientName}' must be registered with a 'stopFn' function, client not registered.`);
      }
      if (!provider) {
        // Set default provider function
        clientFunctions.provider = async () => {
          return this.getProviderFromTemplate(this.blockchainConfig.endpoint);
        };
      }

      this.blockchainNodes[clientName] = clientFunctions;
      cb();
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
        client.launchFn.call(client, (_err, isVM) => {
          started();
          cb(null, isVM);
        });
      });
    });

    const noStartedClientMsg = __('No blockchain client is currently started');
    const noClientFoundMsgFunction = (clientName) => __("Client %s not found in registered plugins", clientName);
    this.events.setCommandHandler("blockchain:node:stop", (clientName, cb) => {
      if (typeof clientName === 'function') {
        cb = clientName;
        clientName = this.startedClient;
        if (!this.startedClient) {
          return cb(noStartedClientMsg);
        }
      }

      const clientFunctions = this.blockchainNodes[clientName];
      if (!clientFunctions) {
        return cb(noClientFoundMsgFunction(clientName));
      }

      clientFunctions.stopFn.apply(clientFunctions, [
        () => {
          this.events.emit("blockchain:stopped", clientName);
          cb();
        }
      ]);
      this.startedClient = null;
    });
    // Returns the provider of the node, hence having a connection directly with the node
    this.events.setCommandHandler('blockchain:node:provider', async (clientName, cb) => {
      if (typeof clientName === 'function') {
        cb = clientName;
        clientName = this.startedClient;
        if (!this.startedClient) {
          return cb(noStartedClientMsg);
        }
      }
      const clientFunctions = this.blockchainNodes[this.startedClient];
      if (!clientFunctions) {
        return cb(__(noClientFoundMsgFunction(clientName)));
      }

      try {
        const provider = await clientFunctions.provider.apply(clientFunctions);
        cb(null, provider);
      } catch (e) {
        cb(e);
      }
    });

    this.events.setCommandHandler('blockchain:node:provider:template', (cb) => {
      cb(null, this.getProviderFromTemplate(this.blockchainConfig.endpoint));
    });

    this.events.setCommandHandler("blockchain:client:register", (clientName, getProviderFunction, cb = () => {}) => {
      this.blockchainClients[clientName] = getProviderFunction;
      cb();
    });

    this.events.setCommandHandler("blockchain:client:provider", async (clientName, cb) => {
      try {
        if (!this.blockchainClients[clientName]) {
          throw new Error(__('No registered client of the name %s.\nRegister one using the `blockchain:client:register` request', clientName));
        }
        const endpoint = await this.events.request2('proxy:endpoint:get');
        const provider = this.blockchainClients[clientName](endpoint);
        cb(null, provider);
      } catch (err) {
        return cb(`Error getting provider: ${err.message || err}`);
      }
    });
    this.events.setCommandHandler("blockchain:started", (cb) => {
      if (this.startedClient) {
        return cb(null, this.startedClient);
      }
      this.events.on("blockchain:started", (clientName) => { cb(null, clientName); });
    });
    this.blockchainApi.registerAPIs("ethereum");
    this.blockchainApi.registerRequests("ethereum");

    if (this.blockchainConfig.enabled && this.blockchainConfig.client === "geth") {
      this.warnIfPackageNotDefinedLocally("embark-geth", this.embark.logger.warn.bind(this.embark.logger), this.embark.config.embarkConfig);
    }
    if (this.blockchainConfig.enabled && this.blockchainConfig.client === "parity") {
      this.warnIfPackageNotDefinedLocally("embark-parity", this.embark.logger.warn.bind(this.embark.logger), this.embark.config.embarkConfig);
    }
  }

  getProviderFromTemplate(endpoint) {
    if (endpoint.startsWith('ws')) {
      return new this.Web3.providers.WebsocketProvider(endpoint, {
        headers: { Origin: constants.embarkResourceOrigin }
      });
    }
    const web3 = new this.Web3(endpoint);
    return web3.currentProvider;
  }

  async addArtifactFile(_params, cb) {
    if (!this.blockchainConfig.enabled) {
      return cb();
    }

    try {
      const networkId = await this.events.request2('blockchain:networkId');
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
            provider: 'web3',
            library: contractsConfig.library || 'embarkjs',
            dappConnection: results,
            dappAutoEnable: contractsConfig.dappAutoEnable,
            warnIfMetamask: this.blockchainConfig.isDev,
            blockchainClient: this.blockchainConfig.client,
            networkId
          };

          this.events.request("pipeline:register", {
            path: [this.embarkConfig.generationDir, 'config'],
            file: 'blockchain.json',
            format: 'json',
            content: config
          }, cb);
        });
      });
    } catch (e) {
      cb(e);
    }
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
