const async = require('async');
const utils = require('../../utils/utils.js');
const constants = require('../../constants');
const BlockchainProcessLauncher = require('./blockchainProcessLauncher');

class BlockchainModule {

  constructor(embark, options) {
    const self = this;
    this.logger = embark.logger;
    this.events = embark.events;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.contractsConfig = embark.config.contractsConfig;
    this.embark = embark;
    this.locale = options.locale;
    this.isDev = options.isDev;

    this.registerBlockchainProcess();
  }

  registerBlockchainProcess() {
    const self = this;
    this.events.request('processes:register', 'blockchain', (cb) => {
      console.dir("gonna check node connection");
      self.assertNodeConnection(true, (connected) => {
        if (connected === undefined) {
          console.dir("result is undefined");
        } else {
          console.dir("result is " + connected.toString());
        }
        //if (!err) return cb();
        if (connected) return cb();
        console.dir("blockchain not started, so gonna start one");
        self.startBlockchainNode(cb);
      });
    });
  }

  assertNodeConnection(noLogs, cb) {
    if (typeof noLogs === 'function') {
      cb = noLogs;
      noLogs = false;
    }
    const NO_NODE_ERROR = Error("error connecting to blockchain node");
    const self = this;

    async.waterfall([
      // check if web3 is set
      // 
      function checkWeb3State(next) {
        console.dir("checkWeb3State");
        self.events.request("blockchain:web3:isReady", (connected) => {
          console.dir("---> checking web3 state");
          console.dir(connected.toString());
          if (connected) {
            return next(connected);
          }
          next();
        })
      },
      //function checkInstance(next) {
      //  if (!self.web3) {
      //    return next(Error("no web3 instance found"));
      //  }
      //  next();
      //},
      //function checkProvider(next) {
      //  if (self.web3.currentProvider === undefined) {
      //    return next(NO_NODE_ERROR);
      //  }
      //  next();
      //},
      function pingEndpoint(next) {
        console.dir("pingEndpoint");
        if (!self.contractsConfig || !self.contractsConfig.deployment || !self.contractsConfig.deployment.host) {
          return next();
        }
        const {host, port, type, protocol}  = self.contractsConfig.deployment;
        console.dir("||||| pinging: ");
        console.dir(self.contractsConfig.deployment);
        utils.pingEndpoint(host, port, type, protocol, self.blockchainConfig.wsOrigins.split(',')[0], next);
      }
    ], function (err, result) {
      console.dir("------");
      console.dir(result);
      console.dir("------");
      if (err === true || result === undefined) {
        return cb(true);
      }
      return cb(false);

      //if (!noLogs && err === NO_NODE_ERROR) {
      //  self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
      //  self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
      //}
      //cb(err);
    });
  }

  startBlockchainNode(callback) {
    console.dir("||==> startBlockchainNode");
    const self = this;
    let blockchainProcess = new BlockchainProcessLauncher({
      events: self.events,
      logger: self.logger,
      normalizeInput: utils.normalizeInput,
      blockchainConfig: self.blockchainConfig,
      locale: self.locale,
      isDev: self.isDev
    });

    blockchainProcess.startBlockchainNode();
    self.events.once(constants.blockchain.blockchainReady, () => {
      console.dir("||==> blockchainReady");
      callback();
    });
    self.events.once(constants.blockchain.blockchainExit, () => {
      console.dir("||==> blockchainExit");
      self.provider.stop();
      callback();
    });
  }

}

module.exports = BlockchainModule;
