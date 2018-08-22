let async = require('async');

const ContractDeployer = require('./contract_deployer.js');
const cloneDeep = require('clone-deep');

class DeployManager {
  constructor(embark, options) {
    const self = this;
    this.config = embark.config;
    this.logger = embark.logger;
    this.blockchainConfig = this.config.blockchainConfig;

    this.events = embark.events;
    this.plugins = options.plugins;
    this.blockchain = options.blockchain;
    this.gasLimit = false;
    this.fatalErrors = false;
    this.deployOnlyOnConfig = false;
    this.onlyCompile = options.onlyCompile !== undefined ? options.onlyCompile : false;

    this.contractDeployer = new ContractDeployer({
      logger: this.logger,
      events: this.events,
      plugins: this.plugins
    });

    this.events.setCommandHandler('deploy:setGasLimit', (gasLimit) => {
      self.gasLimit = gasLimit;
    });

    this.events.setCommandHandler('deploy:contracts', (cb) => {
      self.deployContracts(cb);
    });

    this.events.setCommandHandler('deploy:contracts:test', (cb) => {
      self.fatalErrors = true;
      self.deployOnlyOnConfig = true;
      self.deployContracts(cb);
    });
  }

  deployAll(done) {
    let self = this;

    self.events.request('contracts:dependencies', (err, contractDependencies) => {
      self.events.request('contracts:list', (err, contracts) => {
        if (err) {
          return done(err);
        }

        self.logger.info(__("deploying contracts"));
        self.events.emit("deploy:beforeAll");

            try {
              async.auto(contractDeploys, 1, function(_err, _results) {
                if (errors.length) {
                  _err = __("Error deploying contracts. Please fix errors to continue.");
                  self.logger.error(_err);
                  self.events.emit("outputError", __("Error deploying contracts, please check console"));
                  return done(_err);
                }
                if (contracts.length === 0) {
                  self.logger.info(__("no contracts found"));
                  return done();
                }
                self.logger.info(__("finished deploying contracts"));
                done(err);
              });
            } catch (e) {
              self.logger.error(e.message || e);
              done(__('Error deploying'));
            }
          }
          self.logger.info(__("finished deploying contracts"));
          done(err);
        });
      });
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
      function requestBlockchainConnector(callback) {
        self.events.request("blockchain:object", (blockchain) => {
          self.blockchain = blockchain;
          callback();
        });
      },

      function buildContracts(callback) {
        self.events.request("contracts:build", self.deployOnlyOnConfig, (err) => {
          callback(err);
        });
      },

      // TODO: shouldn't be necessary
      function checkCompileOnly(callback) {
        if (self.onlyCompile) {
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
