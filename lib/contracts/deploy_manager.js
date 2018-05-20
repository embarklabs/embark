let async = require('async');
//require("../utils/debug_util.js")(__filename, async);
let Deploy = require('./deploy.js');

class DeployManager {
  constructor(options) {
    this.config = options.config;
    this.logger = options.logger;
    this.blockchainConfig = this.config.blockchainConfig;

    this.events = options.events;
    this.plugins = options.plugins;
    this.blockchain = options.blockchain;
    this.chainConfig = (options.trackContracts !== false) ? this.config.chainTracker : false;
    this.contractsManager = options.contractsManager;
    this.gasLimit = false;
    this.fatalErrors = false;
    this.deployOnlyOnConfig = false;
    this.onlyCompile = options.onlyCompile !== undefined ? options.onlyCompile : false;
  }

  deployContracts(done) {
    let self = this;

    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      self.logger.info(__("Blockchain component is disabled in the config").underline);
      this.events.emit('blockchainDisabled', {});
      return done();
    }

    async.waterfall([
      function buildContracts(callback) {
        self.contractsManager.deployOnlyOnConfig = self.deployOnlyOnConfig; // temporary, should refactor
        self.contractsManager.build(() => {
          callback();
        });
      },

      // TODO: shouldn't be necessary
      function checkCompileOnly(callback){
        if(self.onlyCompile){
          self.events.emit('contractsDeployed', self.contractsManager);
          return done();
        } 
        return callback();
      },

      // TODO: could be implemented as an event (beforeDeployAll)
      function checkIsConnectedToBlockchain(callback) {
        self.blockchain.assertNodeConnection((err) => {
          callback(err);
        });
      },

      // TODO: this can be done on the fly or as part of the initialization
      function determineDefaultAccount(callback) {
        self.blockchain.determineDefaultAccount((err) => {
          callback(err);
        });
      },

      function deployAllContracts(callback) {
        let deploy = new Deploy({
          blockchain: self.blockchain,
          contractsManager: self.contractsManager,
          logger: self.logger,
          events: self.events,
          chainConfig: self.chainConfig,
          env: self.config.env,
          plugins: self.plugins,
          gasLimit: self.gasLimit
        });

        deploy.deployAll(function (err) {
          if (!err) {
            self.events.emit('contractsDeployed', self.contractsManager);
          }
          if (err && self.fatalErrors) {
            return callback(err);
          }
          callback();
        });
      },
      function runAfterDeploy(callback) {
        let afterDeployPlugins = self.plugins.getPluginsProperty('afterContractsDeployActions', 'afterContractsDeployActions');

        async.eachLimit(afterDeployPlugins, 1, function(plugin, nextEach) {
          plugin.call(plugin, nextEach);
        }, () => {
          callback();
        });
      }
    ], function (err, _result) {
      done(err);
    });
  }

}

module.exports = DeployManager;
