var http = require('http');
var Web3 = require('web3');
var utils = require('../utils/utils.js');

var Events = require('./events.js');
var Logger = require('./logger.js');
var Config = require('./config.js');

var DeployManager = require('../contracts/deploy_manager.js');
var ABIGenerator = require('../contracts/abi.js');
var ServicesMonitor = require('./services_monitor.js');
var Pipeline = require('../pipeline/pipeline.js');
var Server = require('../pipeline/server.js');
var Watch = require('../pipeline/watch.js');
var version = require('../../package.json').version;

var Engine = function(options) {
  this.env = options.env;
  this.embarkConfig = options.embarkConfig;
  this.interceptLogs = options.interceptLogs;
  this.version = version;
};

Engine.prototype.init = function(_options) {
  var self = this;
  var options = _options || {};
  this.events = new Events();
  this.logger = options.logger || new Logger({logLevel: 'debug'});
  this.config = new Config({env: this.env, logger: this.logger, events: this.events});
  this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
  this.plugins = this.config.plugins;

  this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger});
  this.servicesMonitor.addCheck('embarkVersion', function(cb) {
    return cb({name: 'Embark ' + self.version, status: 'green'});
  }, 0);
};

Engine.prototype.startMonitor = function() {
  this.servicesMonitor.startMonitor();
};

Engine.prototype.startService = function(serviceName, _options) {
  var options = _options || {};

  var services = {
    "pipeline":    this.pipelineService,
    "abi":         this.abiService,
    "deployment":  this.deploymentService,
    "fileWatcher": this.fileWatchService,
    "webServer":   this.webServerService,
    "ipfs":        this.ipfsService,
    "web3":        this.web3Service
  };

  var service = services[serviceName];

  if (!service) {
    throw new Error("unknown service: " + serviceName);
  }

  // need to be careful with circular references due to passing the web3 object
  //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
  return service.apply(this, [options]);
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
    web3: options.web3 || self.web3,
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
  var self = this;
  var webServerConfig = this.config.webServerConfig;
  if (!webServerConfig.enabled) { return; }

  var host = options.host || webServerConfig.host;
  var port = options.port  || webServerConfig.port;

  this.logger.setStatus("Starting Server");
  var server = new Server({
    logger: this.logger,
    host: host,
    port: port
  });

  self.servicesMonitor.addCheck('Webserver', function(cb) {
    var devServer = 'Webserver (http://' + host + ':' + port + ')';
    return cb({name: devServer, status: 'green'});
  });

  server.start(function(){
  });
};

Engine.prototype.ipfsService = function(options) {
  var self = this;
  self.servicesMonitor.addCheck('IPFS', function(cb) {
    utils.checkIsAvailable('http://localhost:5001', function(available) {
      if (available) {
        //Ideally this method should be in an IPFS API JSONRPC wrapper
        //The URL should also be flexible to accept non-default IPFS url
        self.logger.trace("Checking IPFS version...");
        http.get('http://localhost:5001/api/v0/version', function(res) {
          var body = '';
          res.on('data', function(d) {
            body += d;
          });
          res.on('end', function() {
            try{
              var parsed = JSON.parse(body);
              if(parsed.Version){
                return cb({name: ("IPFS " + parsed.Version), status: 'green'});
              }
              else{
                return cb({name: "IPFS ", status: 'green'});
              }
            }
            catch (e){
              return cb({name: "IPFS ", status: 'red'});
            }
          });
          res.on('error', function(err) {
            self.logger.trace("Check IPFS version error: " + err);
            return cb({name: "IPFS ", status: 'red'});
          });
        });
      }
      else {
        return cb({name: "IPFS ", status: 'red'});
      }
    });
  });
};

Engine.prototype.web3Service = function(options) {
  var self = this;
  this.web3 = options.web3;
  if (this.web3 === undefined) {
    this.web3 = new Web3();
    var web3Endpoint = 'http://' + this.config.blockchainConfig.rpcHost + ':' + this.config.blockchainConfig.rpcPort;
    this.web3.setProvider(new this.web3.providers.HttpProvider(web3Endpoint));
  }

  self.servicesMonitor.addCheck('Ethereum', function(cb) {
    if (self.web3.isConnected()) {
      return cb({name: (self.web3.version.node.split("/")[0] + " " + self.web3.version.node.split("/")[1].split("-")[0] + " (Ethereum)"), status: 'green'});
    } else {
      return cb({name: "No Blockchain node found", status: 'red'});
    }
  });

  self.servicesMonitor.addCheck('Whisper', function(cb) {
    self.web3.version.getWhisper(function(err, res) {
      if (err) {
        return cb({name: 'Whisper', status: 'red'});
      } else {
        return cb({name: 'Whisper', status: 'green'});
      }
    });
  });
};


module.exports = Engine;
