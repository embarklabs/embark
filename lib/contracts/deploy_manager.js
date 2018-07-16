let async = require('async');

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

      async.eachOfSeries(contracts,
        function (contract, key, callback) {
          contract._gasLimit = self.gasLimit;
          self.events.request('deploy:contract', contract, (err) => {
            callback(err);
          });
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
          console.dir('[contracts/deploy_manager]: done building contracts');
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
        console.dir('[contracts/deploy_manager]: checking connection to blockchain');
        self.blockchain.onReady(() => {
          console.dir('[contracts/deploy_manager]: onReady called, asserting node connection');
          self.blockchain.assertNodeConnection((err) => {
            console.dir('[contracts/deploy_manager]: node connection asserted, err: ' + JSON.stringify(err));
            callback(err);
          });
        });
      },

      // TODO: this can be done on the fly or as part of the initialization
      function determineDefaultAccount(callback) {
        console.dir('[contracts/deploy_manager]: determining default acct');
        self.blockchain.determineDefaultAccount((err) => {
          callback(err);
        });
      },

      function deployAllContracts(callback) {
        console.dir('[contracts/deploy_manager]: deploying all contracts');
        self.deployAll(function (err) {
          console.dir('[contracts/deploy_manager]: done deploying all contracts, err: ' + JSON.stringify(err));
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
        console.dir('[contracts/deploy_manager]: emitting and running actions for event "contracts:deploy:afterAll"');
        self.plugins.emitAndRunActionsForEvent('contracts:deploy:afterAll', callback);
      }
    ], function (err, _result) {
      done(err);
    });
  }

}

module.exports = DeployManager;
