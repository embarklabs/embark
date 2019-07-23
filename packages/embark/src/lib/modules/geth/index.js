const { normalizeInput } = require('embark-utils');
import { BlockchainProcessLauncher } from './blockchainProcessLauncher';

class Geth {

  constructor(embark, options) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.locale = options.locale;
    this.logger = embark.logger;
    this.client = options.client;
    this.isDev = options.isDev;
    this.events = embark.events;
    this.plugins = options.plugins;
    let plugin = this.plugins.createPlugin('gethplugin', {});

    this.events.request("blockchain:node:register", "geth", (readyCb) => {
      console.dir('registering blockchain node')
      console.dir(readyCb)
      this.events.request('processes:register', 'blockchain', {
        launchFn: (cb) => {
          // this.startBlockchainNode(readyCb);
          this.startBlockchainNode(cb);
        },
        stopFn: (cb) => { this.stopBlockchainNode(cb); }
      });
      this.events.request("processes:launch", "blockchain", (err) => {
        readyCb()
      });
    })
  }

  startBlockchainNode(callback) {
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

    if(!this.blockchainProcess) {
      return cb();
    }

    this.blockchainProcess.stopBlockchainNode(() => {
      this.logger.info(message);
      cb();
    });
  }

}

module.exports = Geth;
