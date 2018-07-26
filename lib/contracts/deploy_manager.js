let async = require('async');

//require("../utils/debug_util.js")(__filename, async);

class DeployManager {
  constructor(options) {
    const self = this;
    this.config = options.config;
    this.logger = options.logger;
    this.blockchainConfig = this.config.blockchainConfig;

    this.events = options.events;
    this.plugins = options.plugins;
    this.blockchain = options.blockchain;
    this.gasLimit = false;
    this.fatalErrors = false;
    this.deployOnlyOnConfig = false;
    this.onlyCompile = options.onlyCompile !== undefined ? options.onlyCompile : false;

    this.events.setCommandHandler('deploy:contracts', (cb) => {
      self.deployContracts(cb);
    });
  }

  deployAll(done) {
    let self = this;

    self.events.request('contracts:list', (err, contracts) => {
      if (err) {
        return done(err);
      }

      self.logger.info(__("deploying contracts"));
      self.events.emit("deploy:beforeAll");

      const contractsPerDependencyCount = utils.groupBy(contracts, 'dependencyCount');
      async.eachSeries(contractsPerDependencyCount,
        function (parallelGroups, callback) {
          async.each(parallelGroups, (contract, eachCb) => {
            contract._gasLimit = self.gasLimit;
            self.events.request('deploy:contract', contract, (err) => {
              eachCb(err);
            });
          }, callback);
        },
        function (err, _results) {
          if (err) {
            self.logger.error(__("error deploying contracts"));
            self.logger.error(err.message);
            self.logger.debug(err.stack);
          }
          if (contracts.length === 0) {
            self.logger.info(__("no contracts found"));
            return done();
          }
          self.logger.info(__("finished deploying contracts"));
          done(err);
        }
      );
    });
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
        self.events.request("contracts:build", self.deployOnlyOnConfig, (err) => {
          callback(err);
        });
      },

      // TODO: shouldn't be necessary
      function checkCompileOnly(callback){
        if(self.onlyCompile){
          self.events.emit('contractsDeployed');
          return done();
        } 
        return callback();
      },

      // TODO: could be implemented as an event (beforeDeployAll)
      function checkIsConnectedToBlockchain(callback) {
        self.blockchain.onReady((err) => {
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
        self.deployAll(function (err) {
          if (!err) {
            self.events.emit('contractsDeployed');
          }
          if (err && self.fatalErrors) {
            return callback(err);
          }
          callback();
        });
      },
      function runAfterDeploy(callback) {
        self.plugins.emitAndRunActionsForEvent('contracts:deploy:afterAll', callback);
      }
    ], function (err, _result) {
      done(err);
    });
  }

}

module.exports = DeployManager;
