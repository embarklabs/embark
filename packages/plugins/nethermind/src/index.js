import { __ } from 'embark-i18n';
import {BlockchainClient} from "./blockchain";
const {normalizeInput, testRpcWithEndpoint, testWsEndpoint} = require('embark-utils');
import {BlockchainProcessLauncher} from './blockchainProcessLauncher';
import constants from "embark-core/constants";

class Nethermind {
  constructor(embark) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.locale = embark.config.locale;
    this.logger = embark.logger;
    this.client = embark.config.blockchainConfig.client;
    this.isDev = embark.config.blockchainConfig.isDev;
    this.events = embark.events;

    if (!this.shouldInit()) {
      return;
    }

    this.events.request("blockchain:node:register", constants.blockchain.clients.nethermind, {
      isStartedFn: (isStartedCb) => {
        this._doCheck((state) => {
          console.log('Started?', JSON.stringify(state));
          return isStartedCb(null, state.status === "on");
        });
      },
      launchFn: (readyCb) => {
        this.events.request('processes:register', 'blockchain', {
          launchFn: (cb) => {
            this.startBlockchainNode(cb);
          },
          stopFn: (cb) => {
            this.stopBlockchainNode(cb);
          }
        });
        this.events.request("processes:launch", "blockchain", (err) => {
          if (err) {
            this.logger.error(`Error launching blockchain process: ${err.message || err}`);
          }
          readyCb();
        });
        this.registerServiceCheck();
      },
      stopFn: async (cb) => {
        await this.events.request("processes:stop", "blockchain");
        cb();
      }
    });
  }

  shouldInit() {
    return (
      this.blockchainConfig.client === constants.blockchain.clients.nethermind &&
      this.blockchainConfig.enabled
    );
  }

  _getNodeState(err, version, cb) {
    if (err) return cb({ name: "Ethereum node not found", status: 'off' });

    return cb({ name: `${constants.blockchain.clients.nethermind} (Ethereum)`, status: 'on' });
  }

  _doCheck(cb) {
    if (this.blockchainConfig.endpoint.startsWith('ws')) {
      return testWsEndpoint(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
    }
    testRpcWithEndpoint(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
  }

  registerServiceCheck() {
    this.events.request("services:register", 'Ethereum', this._doCheck.bind(this), 5000, 'off');
  }

  startBlockchainNode(callback) {
    if (this.blockchainConfig.isStandalone) {
      return new BlockchainClient(this.blockchainConfig, {
        clientName: constants.blockchain.clients.nethermind,
        env: this.embark.config.env,
        certOptions: this.embark.config.webServerConfig.certOptions,
        logger: this.logger,
        events: this.events,
        isStandalone: true,
        fs: this.embark.fs
      }).run();
    }

    this.blockchainProcess = new BlockchainProcessLauncher({
      events: this.events,
      env: this.embark.config.env,
      logger: this.logger,
      normalizeInput,
      blockchainConfig: this.blockchainConfig,
      locale: this.locale,
      client: this.client,
      isDev: this.isDev,
      embark: this.embark
    });

    this.blockchainProcess.startBlockchainNode(callback);
  }

  stopBlockchainNode(cb) {
    const message = __(`The blockchain process has been stopped. It can be restarted by running ${"service blockchain on".bold} in the Embark console.`);

    if (!this.blockchainProcess) {
      return cb();
    }

    this.blockchainProcess.stopBlockchainNode(() => {
      this.logger.info(message);
      cb();
    });
  }

}

module.exports = Nethermind;
