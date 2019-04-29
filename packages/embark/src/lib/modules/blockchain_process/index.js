const async = require('async');
const utils = require('../../utils/utils.js');
const {normalizeInput} = require('embark-utils');
const constants = require('embark-core/constants');
const BlockchainProcessLauncher = require('./blockchainProcessLauncher');

class BlockchainModule {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractsConfig = embark.config.contractsConfig;
    this.embark = embark;
    this.locale = options.locale;
    this.isDev = options.isDev;
    this.ipc = options.ipc;
    this.client = options.client;
    this.blockchainProcess =  null;

    this.registerBlockchainProcess();
  }

  registerBlockchainProcess() {
    this.events.request('processes:register', 'blockchain', {
      launchFn: (cb) => {
        this.assertNodeConnection(true, (connected) => {
          if (connected) return cb();
          this.startBlockchainNode(cb);
          this.listenToCommands();
          this.registerConsoleCommands();
        });
      },
      stopFn: (cb) => { this.stopBlockchainNode(cb); }
    });

    if (!this.ipc.isServer()) return;
    this.ipc.on('blockchain:node', (_message, cb) => {
      cb(null, utils.buildUrlFromConfig(this.contractsConfig.deployment));
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('logs:ethereum:enable',  (cb) => {
      this.events.emit('logs:ethereum:enable');
      return cb(null, 'Enabling Geth logs');
    });

    this.events.setCommandHandler('logs:ethereum:disable',  (cb) => {
      this.events.emit('logs:ethereum:disable');
      return cb(null, 'Disabling Geth logs');
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

  assertNodeConnection(noLogs, cb) {
    if (typeof noLogs === 'function') {
      cb = noLogs;
      noLogs = false;
    }
    const self = this;

    async.waterfall([
      function checkWeb3State(next) {
        self.events.request("blockchain:web3:isReady", (connected) => {
          if (connected) {
            return next(connected);
          }
          next();
        });
      },
      function pingEndpoint(next) {
        if (!self.contractsConfig || !self.contractsConfig.deployment || !self.contractsConfig.deployment.host) {
          return next();
        }
        const {host, port, type, protocol} = self.contractsConfig.deployment;
        utils.pingEndpoint(host, port, type, protocol, self.blockchainConfig.wsOrigins.split(',')[0], next);
      }
    ], function(err) {
      if (err === true || err === undefined) {
        return cb(true);
      }
      return cb(false);
    });
  }

  startBlockchainNode(callback) {
    const self = this;

    this.blockchainProcess = new BlockchainProcessLauncher({
      events: self.events,
      logger: self.logger,
      normalizeInput,
      blockchainConfig: self.blockchainConfig,
      locale: self.locale,
      client: self.client,
      isDev: self.isDev,
      embark: this.embark
    });

    this.blockchainProcess.startBlockchainNode();
    this.events.once(constants.blockchain.blockchainReady, () => {
      this.assertNodeConnection(true, (connected) => {
        if (!connected) {
          return callback(__('Blockchain process is ready, but still cannot connect to it. Check your host, port and protocol in your contracts config'));
        }
        this.events.removeListener(constants.blockchain.blockchainExit, callback);
        callback();
      });
    });
    this.events.once(constants.blockchain.blockchainExit, callback);
  }

  stopBlockchainNode(cb) {
    const message = __(`The blockchain process has been stopped. It can be restarted by running ${"service blockchain on".bold} in the Embark console.`);
    if (this.ipc.isServer()) {
      if(!this.ipc.connected) {
        this.ipc.connect(() => {
          this.ipc.broadcast('process:blockchain:stop');
          this.logger.info(message);
        });
      }
      else this.ipc.broadcast('process:blockchain:stop');
    }

    if(!this.blockchainProcess) {
      return cb();
    }

    this.blockchainProcess.stopBlockchainNode(() => {
      this.logger.info(message);
      cb();
    });
  }

}

module.exports = BlockchainModule;
