import { __ } from "embark-i18n";
import {testRpcWithEndpoint, testWsEndpoint} from "embark-utils";
import constants from "embark-core/constants";
import { QuorumWeb3Extensions } from "./quorumWeb3Extensions";
import QuorumDeployer from "./deployer";
export { getBlock, getTransaction, getTransactionReceipt, decodeParameters } from "./quorumWeb3Extensions";

class Quorum {
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

    this.events.request("blockchain:node:register", constants.blockchain.clients.quorum, {
      isStartedFn: (isStartedCb) => {
        this._doCheck((state) => {
          const isStarted = state.status === "on";
          if (isStarted) {
            this.registerServiceCheck();
          } else {
            this.logger.error(__('Cannot connect to the configured Quorum node. Please start Quorum manually.'));
          }
          return isStartedCb(null, isStarted);
        });
      },
      launchFn: (readyCb) => {
        this.logger.warn(__('Quorum must be started manually. Please start Quorum, then restart Embark.'));
        readyCb();
      },
      stopFn: async (cb) => {
        this.logger.warn(__('Quorum cannot be stopped using Embark. Please stop Quorum manually.'));
        cb();
      }
    });

    this.init(); // fire and forget
  }

  async init() {
    const web3Overrides = new QuorumWeb3Extensions(this.embark);
    await web3Overrides.registerOverrides();

    const deployer = new QuorumDeployer(this.embark);
    await deployer.registerDeployer();
  }

  shouldInit() {
    return (
      this.blockchainConfig.client === constants.blockchain.clients.quorum &&
      this.blockchainConfig.enabled
    );
  }

  _getNodeState(err, version, cb) {
    if (err) return cb({ name: "Ethereum node not found", status: 'off' });

    return cb({ name: `${constants.blockchain.clients.quorum} (Ethereum)`, status: 'on' });
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

}
module.exports = Quorum;
