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
      this.registerServiceCheck()
    })
  }

  registerServiceCheck() {
    console.dir("registerServiceCheck")
    this.events.request("services:register", 'Ethereum', function (cb) {
      cb({ name: "go-ethereum 1.1", status: 'on' })
      // async.waterfall([
      //   function checkNodeConnection(next) {
      //     if (!self.provider || !self.provider.connected()) {
      //       return next(NO_NODE, { name: "No Blockchain node found", status: 'off' });
      //     }
      //     next();
      //   },
      //   function checkVersion(next) {
      //     // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
      //     self.web3._requestManager.send({ method: 'web3_clientVersion', params: [] }, (err, version) => {
      //       if (err || !version) {
      //         self.isWeb3Ready = false;
      //         return next(null, { name: "Ethereum node not found", status: 'off' });
      //       }
      //       if (version.indexOf("/") < 0) {
      //         self.events.emit(WEB3_READY);
      //         self.isWeb3Ready = true;
      //         return next(null, { name: version, status: 'on' });
      //       }
      //       let nodeName = version.split("/")[0];
      //       let versionNumber = version.split("/")[1].split("-")[0];
      //       let name = nodeName + " " + versionNumber + " (Ethereum)";

      //       self.events.emit(WEB3_READY);
      //       self.isWeb3Ready = true;
      //       return next(null, { name: name, status: 'on' });
      //     });
      //   }
      // ], (err, statusObj) => {
      //   if (err && err !== NO_NODE) {
      //     return cb(err);
      //   }
      //   cb(statusObj);
      // });
    }, 5000, 'off');
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
