var async = require('async');
var Web3 = require('web3');

var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');

var DeployManager = function(options) {
  this.config = options.config;
  this.logger = options.logger;
  this.plugins = options.plugins;
  this.events = options.events;
};

DeployManager.prototype.deployContracts = function(done) {
  var self = this;
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
  function deployContracts(contractsManager, callback) {

    //TODO: figure out where to put this since the web3 can be passed along if needed
    // perhaps it should go into the deploy object itself
    // TODO: should come from the config object
    var web3 = new Web3();
    var web3Endpoint = 'http://' + self.config.blockchainConfig.rpcHost + ':' + self.config.blockchainConfig.rpcPort;
    web3.setProvider(new web3.providers.HttpProvider(web3Endpoint));

    if (!web3.isConnected()) {
      self.logger.error(("Couldn't connect to " + web3Endpoint.underline + " are you sure it's on?").red);
      self.logger.info("make sure you have an ethereum node or simulator running. e.g 'embark blockchain'".magenta);
      return callback(Error("error connecting to blockchain node"));
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
        chainConfig: self.config.chainTracker,
        env: self.config.env
      });
      deploy.deployAll(function() {
        callback(null, contractsManager);
        self.events.emit('contractsDeployed');
      });
    });
  },
  function generateABI(contractsManager, callback) {
      var abiGenerator = new ABIGenerator({blockchainConfig: self.config.blockchainConfig, contractsManager: contractsManager, plugins: self.plugins, storageConfig: self.config.storageConfig});
      var embarkJSABI = abiGenerator.generateABI({useEmbarkJS: true});
      var vanillaABI = abiGenerator.generateABI({useEmbarkJS: false});

      self.events.emit('abi-vanila', vanillaABI);
      self.events.emit('abi', embarkJSABI);

      callback(null, embarkJSABI);
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

