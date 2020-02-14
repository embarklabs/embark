import { __ } from 'embark-i18n';
const {normalizeInput} = require('embark-utils');
import { BlockchainProcessLauncher } from './blockchainProcessLauncher';
import { BlockchainClient } from './blockchain';
import { ws, rpcWithEndpoint } from './check.js';
import DevTxs from "./devtxs";
import constants from 'embark-core/constants';

class Geth {
  constructor(embark) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.communicationConfig = embark.config.communicationConfig;
    // TODO get options from config instead of options
    this.locale = embark.config.locale;
    this.logger = embark.logger;
    this.client = embark.client;
    this.events = embark.events;
    this.plugins = embark.plugins;
    this.shownNoAccountConfigMsg = false; // flag to ensure "no account config" message is only displayed once to the user
    this.isDev = (this.blockchainConfig.isDev || this.blockchainConfig.default);

    if (!this.shouldInit()) {
      return;
    }

    this.events.request("blockchain:node:register", constants.blockchain.clients.geth, {
      isStartedFn: (isStartedCb) => {
        this._doCheck((state) => {
          return isStartedCb(null, state.status === "on");
        });
      },
      launchFn: (readyCb) => {
        this.events.request('processes:register', 'blockchain', {
          launchFn: (cb) => {
            if (!this.shownNoAccountConfigMsg &&
              (/rinkeby|testnet|livenet/).test(this.blockchainConfig.networkType) &&
              !(this.blockchainConfig.accounts && this.blockchainConfig.accounts.find(acc => acc.password)) &&
              !this.blockchainConfig.isDev && this.embark.env !== 'development' && this.embark.env !== 'test') {
              this.logger.warn((
                '\n=== ' + __('Cannot unlock account - account config missing').bold + ' ===\n' +
                __('Geth is configured to sync to a testnet/livenet and needs to unlock an account ' +
                  'to allow your dApp to interact with geth, however, the address and password must ' +
                  'be specified in your blockchain config. Please update your blockchain config with ' +
                  'a valid address and password: \n') +
                ` - config/blockchain.js > ${this.embark.env} > account\n\n`.italic +
                __('Please also make sure the keystore file for the account is located at: ') +
                '\n - Mac: ' + `~/Library/Ethereum/${this.embark.env}/keystore`.italic +
                '\n - Linux: ' + `~/.ethereum/${this.embark.env}/keystore`.italic +
                '\n - Windows: ' + `%APPDATA%\\Ethereum\\${this.embark.env}\\keystore`.italic) +
                __('\n\nAlternatively, you could change ' +
                  `config/blockchain.js > ${this.embark.env} > networkType`.italic +
                  __(' to ') +
                  '"custom"\n'.italic).yellow
              );
              this.shownNoAccountConfigMsg = true;
            }
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
          this.setupDevTxs();
        });
        this.registerServiceCheck();
      },
      stopFn: async (cb) => {
        await this.events.request2("processes:stop", "blockchain");
        cb();
      }
    });
  }

  async setupDevTxs() {
    const devTxs = new DevTxs(this.embark);
    await devTxs.init();
    try {
      await devTxs.startRegularTxs();
      this.logger.info("Regular transactions started");
    } catch (err) {
      this.logger.error(`Error starting regular transactions: ${err.message}`);
    }
  }

  shouldInit() {
    return (
      this.blockchainConfig.client === constants.blockchain.clients.geth &&
      this.blockchainConfig.enabled
    );
  }

  _getNodeState(err, version, cb) {
    if (err) return cb({ name: "Ethereum node not found", status: 'off' });

    let nodeName = "go-ethereum";
    let versionNumber = version.split("-")[0];
    let name = nodeName + " " + versionNumber + " (Ethereum)";
    return cb({ name, status: 'on' });
  }

  _doCheck(cb) {
    if (this.blockchainConfig.endpoint.startsWith('ws')) {
      return ws(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
    }
    rpcWithEndpoint(this.blockchainConfig.endpoint, (err, version) => this._getNodeState(err, version, cb));
  }

  registerServiceCheck() {
    this.events.request("services:register", 'Ethereum', (cb) => {
      this._doCheck(cb);
    }, 5000, 'off');
  }

  startBlockchainNode(callback) {
    if (this.blockchainConfig.isStandalone) {
      return new BlockchainClient(this.blockchainConfig, {
        clientName: 'geth',
        env: this.embark.env,
        certOptions: this.embark.config.webServerConfig.certOptions,
        logger: this.logger,
        events: this.events,
        isStandalone: true,
        fs: this.embark.fs
      }).run();
    }

    this.blockchainProcess = new BlockchainProcessLauncher({
      events: this.events,
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

module.exports = Geth;
