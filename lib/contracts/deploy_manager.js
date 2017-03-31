let async = require('async');
let Deploy = require('./deploy.js');
let ContractsManager = require('./contracts.js');

class DeployManager {
  constructor(options) {
    this.config = options.config;
    this.logger = options.logger;
    this.blockchainConfig = this.config.blockchainConfig;
    this.events = options.events;
    this.plugins = options.plugins;
    this.web3 = options.web3;
    this.chainConfig = (options.trackContracts !== false) ? this.config.chainTracker : false;
  }

  deployContracts(done) {
    let self = this;

    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      self.logger.info("Blockchain component is disabled in the config".underline);
      this.events.emit('blockchainDisabled', {});
      return done();
    }

    async.waterfall([
      function buildContracts(callback) {
        let contractsManager = new ContractsManager({
          contractFiles: self.config.contractsFiles,
          contractsConfig: self.config.contractsConfig,
          logger: self.logger,
          plugins: self.plugins
        });
        contractsManager.build(callback);
      },
      function checkWeb3IsConnected(contractsManager, callback) {
        if (!self.web3) {
          return callback(Error("no web3 instance found"));
        }
        if (self.web3.currentProvider.isConnected !== undefined && !self.web3.isConnected()) {
          self.logger.error(("Couldn't connect to an Ethereum node are you sure it's on?").red);
          self.logger.info("make sure you have an Ethereum node or simulator running. e.g 'embark blockchain'".magenta);
          return callback(Error("error connecting to blockchain node"));
        }
        if (self.web3.currentProvider.isConnected === undefined) {
          self.web3.version.getNode(function (err, version) {
            if (err) {
              return callback(Error("error connecting to blockchain node"));
            }
            return callback(null, contractsManager, self.web3);
          });
        } else {
          return callback(null, contractsManager, self.web3);
        }
      },
      function setDefaultAccount(contractsManager, web3, callback) {
        web3.eth.getAccounts(function (err, accounts) {
          if (err) {
            return callback(new Error(err));
          }
          let accountConfig = self.config.blockchainConfig.account;
          let selectedAccount = accountConfig && accountConfig.address;
          web3.eth.defaultAccount = (selectedAccount || accounts[0]);
          callback(null, contractsManager, web3);
        });
      },
      function deployAllContracts(contractsManager, web3, callback) {
        let deploy = new Deploy({
          web3: web3,
          contractsManager: contractsManager,
          logger: self.logger,
          chainConfig: self.chainConfig,
          env: self.config.env
        });
        deploy.deployAll(function () {
          self.events.emit('contractsDeployed', contractsManager);
          callback(null, contractsManager);
        });
      }
    ], function (err, result) {
      if (err) {
        done(err, null);
      } else {
        done(null, result);
      }
    });
  }

}

module.exports = DeployManager;
