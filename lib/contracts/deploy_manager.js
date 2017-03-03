var async = require('async');
var Web3 = require('web3');

var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');

var DeployManager = function(options) {
  this.config = options.config;
  this.logger = options.logger;
  this.blockchainConfig = this.config.blockchainConfig;
  this.plugins = options.plugins;
  this.events = options.events;
  this.web3 = options.web3;
  // TODO: lol, redo this
  if (options.trackContracts !== false) {
    this.chainConfig = this.config.chainTracker;
  } else {
    this.chainConfig = false;
  }
};

DeployManager.prototype.deployContracts = function(done) {
  var self = this;

  if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
    self.logger.info("Blockchain component is disabled in the config".underline);
    self.events.emit('blockchainDisabled', {});
    return done();
  }

  async.waterfall([
  function buildContracts(callback) {
    var contractsManager = new ContractsManager({
      contractFiles:  self.config.contractsFiles,
      contractsConfig: self.config.contractsConfig,
      logger: self.logger,
      plugins: self.plugins
    });
    contractsManager.build(callback);
  },
  function deployContracts2(contractsManager, callback) {

    //TODO: figure out where to put this since the web3 can be passed along if needed
    // perhaps it should go into the deploy object itself
    // TODO: should come from the config object
    var web3;
    if (self.web3) {
      web3 = self.web3;
    } else {
      web3 = new Web3();
      var web3Endpoint = 'http://' + self.config.blockchainConfig.rpcHost + ':' + self.config.blockchainConfig.rpcPort;
      web3.setProvider(new web3.providers.HttpProvider(web3Endpoint));

      if (!web3.isConnected()) {
        self.logger.error(("Couldn't connect to " + web3Endpoint.underline + " are you sure it's on?").red);
        self.logger.info("make sure you have an ethereum node or simulator running. e.g 'embark blockchain'".magenta);
        return callback(Error("error connecting to blockchain node"));
      }
    }

    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        return callback(new Error(err));
      }
      web3.eth.defaultAccount = accounts[0];

      var deploy = new Deploy({
        web3: web3,
        contractsManager: contractsManager,
        logger: self.logger,
        chainConfig: self.chainConfig,
        env: self.config.env
      });
      deploy.deployAll(function() {
        self.events.emit('contractsDeployed', contractsManager);
        callback(null, contractsManager);
      });
    });
  }
  ], function(err, result) {
    if (err) {
      done(err, null);
    } else {
      done(null, result);
    }
  });
};

module.exports = DeployManager;

