const async = require('async');
const utils = require('../../utils/utils.js');
const constants = require('../../constants');
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

    this.registerBlockchainProcess();
  }

  registerBlockchainProcess() {
    const self = this;
    this.events.request('processes:register', 'blockchain', (cb) => {
      self.assertNodeConnection(true, (connected) => {
        if (connected) return cb();
        self.startBlockchainNode(cb);
        this.listenToCommands();
        this.registerConsoleCommands();
      });
    });

    if (!this.ipc.isServer()) return;
    self.ipc.on('blockchain:node', (_message, cb) => {
      cb(null, utils.buildUrlFromConfig(self.contractsConfig.deployment));
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('logs:ethereum:turnOn',  (cb) => {
      this.events.emit('logs:ethereum:enable');
      return cb(null, 'Enabling Geth logs');
    });

    this.events.setCommandHandler('logs:ethereum:turnOff',  (cb) => {
      this.events.emit('logs:ethereum:disable');
      return cb(null, 'Disabling Geth logs');
    });
  }

  registerConsoleCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'log blockchain on',
        process: (cb) => self.events.request('logs:ethereum:turnOn', cb)
      };
    });

    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'log blockchain off',
        process: (cb) => self.events.request('logs:ethereum:turnOff', cb)
      };
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

    let blockchainProcess = new BlockchainProcessLauncher({
      events: self.events,
      logger: self.logger,
      normalizeInput: utils.normalizeInput,
      blockchainConfig: self.blockchainConfig,
      locale: self.locale,
      client: self.client,
      isDev: self.isDev,
      embark: this.embark
    });

    blockchainProcess.startBlockchainNode();
    self.events.once(constants.blockchain.blockchainReady, () => {
      callback();
    });
    self.events.once(constants.blockchain.blockchainExit, () => {
      callback();
    });
  }

}

module.exports = BlockchainModule;
