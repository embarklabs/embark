var Events = require('./events.js');
var Logger = require('./logger.js');
var Config = require('./config.js');

var DeployManager = require('../contracts/deploy_manager.js');
var ABIGenerator = require('../contracts/abi.js');
var Dashboard = require('../dashboard/dashboard.js');
var ServicesMonitor = require('./services.js');
var Pipeline = require('../pipeline/pipeline.js');
var Server = require('../pipeline/server.js');
var Watch = require('../pipeline/watch.js');

var Engine = function(options) {
  this.env = options.env;
  this.embarkConfig = options.embarkConfig;
  this.interceptLogs = options.interceptLogs;
  this.version = "2.4.2";
};

Engine.prototype.init = function(_options) {
  var options = _options || {};
  this.events = new Events();
  this.logger = options.logger || new Logger({logLevel: 'debug'});
  this.config = new Config({env: this.env, logger: this.logger, events: this.events});
  this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
  this.plugins = this.config.plugins;
};

Engine.prototype.startService = function(serviceName, _options) {
  var options = _options || {};

  var services = {
    "monitor":     this.monitorService,
    "pipeline":    this.pipelineService,
    "abi":         this.abiService,
    "deployment":  this.deploymentService,
    "fileWatcher": this.fileWatchService,
    "webServer":   this.webServerService
  };

  var service = services[serviceName];

  if (!service) {
    throw new Error("unknown service: " + serviceName);
  }

  // need to be careful with circular references due to passing the web3 object
  //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
  return service.apply(this, [options]);
};

Engine.prototype.monitorService = function(options) {
  var servicesMonitor = new ServicesMonitor({
    logger: this.logger,
    config: this.config,
    serverHost: options.serverHost,
    serverPort: options.serverPort,
    runWebserver: options.runWebserver,
    version: this.version
  });
  servicesMonitor.startMonitor();
};

Engine.prototype.pipelineService = function(options) {
  var self = this;
  this.logger.setStatus("Building Assets");
  var pipeline = new Pipeline({
    buildDir: this.config.buildDir,
    contractsFiles: this.config.contractsFiles,
    assetFiles: this.config.assetFiles,
    logger: this.logger,
    plugins: this.plugins
  });
  this.events.on('abi', function(abi) {
    self.currentAbi = abi;
    pipeline.build(abi);
    self.events.emit('outputDone');
  });
  // TODO: still need to redeploy contracts because the original contracts
  // config is being corrupted
  //this.events.on('file-event', function(fileType, path) {
  //  if (fileType === 'asset') {
  //    self.config.reloadConfig();
  //    pipeline.build(self.abi, path);
  //    self.events.emit('outputDone');
  //  }
  //});
};

Engine.prototype.abiService = function(options) {
  var self = this;
  var generateABICode = function(contractsManager) {
    var abiGenerator = new ABIGenerator({
      blockchainConfig: self.config.blockchainConfig,
      contractsManager: contractsManager,
      plugins: self.plugins,
      storageConfig: self.config.storageConfig,
      communicationConfig: self.config.communicationConfig
    });
    var embarkJSABI = abiGenerator.generateABI({useEmbarkJS: true});
    var vanillaABI = abiGenerator.generateABI({useEmbarkJS: false});
    var vanillaContractsABI = abiGenerator.generateContracts(false);

    self.events.emit('abi-contracts-vanila', vanillaContractsABI);
    self.events.emit('abi-vanila', vanillaABI);
    self.events.emit('abi', embarkJSABI);
  };
  this.events.on('contractsDeployed', generateABICode);
  this.events.on('blockchainDisabled', generateABICode);
};

Engine.prototype.deploymentService = function(options) {
  var self = this;
  this.deployManager = new DeployManager({
    web3: options.web3,
    trackContracts: options.trackContracts,
    config: this.config,
    logger: this.logger,
    plugins: this.plugins,
    events: this.events
  });

  this.events.on('file-event', function(fileType, path) {
    // TODO: for now need to deploy on asset chanes as well
    // because the contractsManager config is corrupted after a deploy
    //if (fileType === 'contract' || fileType === 'config') {
      self.config.reloadConfig();
      self.deployManager.deployContracts(function() {});
    //}
  });
};

Engine.prototype.fileWatchService = function(options) {
  this.logger.setStatus("Watching for changes");
  var watch = new Watch({logger: this.logger, events: this.events});
  watch.start();
};

Engine.prototype.webServerService = function(options) {
  var webServerConfig = this.config.webServerConfig;
  if (!webServerConfig.enabled) { return; }
  this.logger.setStatus("Starting Server");
  var server = new Server({
    logger: this.logger,
    host: options.host || webServerConfig.host,
    port: options.port  || webServerConfig.port
  });
  server.start(function(){});
};

module.exports = Engine;
