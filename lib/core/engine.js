let http = require('http');
let Web3 = require('web3');
let utils = require('../utils/utils.js');

let Events = require('./events.js');
let Logger = require('./logger.js');
let Config = require('./config.js');

let DeployManager = require('../contracts/deploy_manager.js');
let ABIGenerator = require('../contracts/abi.js');
let ServicesMonitor = require('./services_monitor.js');
let Pipeline = require('../pipeline/pipeline.js');
let Server = require('../pipeline/server.js');
let Watch = require('../pipeline/watch.js');
let version = require('../../package.json').version;

let Engine = function(options) {
  this.env = options.env;
  this.embarkConfig = options.embarkConfig;
  this.interceptLogs = options.interceptLogs;
  this.version = version;
};

Engine.prototype.init = function(_options) {
  let self = this;
  let options = _options || {};
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
  let self = this;
  if (this.plugins) {
    let servicePlugins = this.plugins.getPluginsFor('serviceChecks');
    servicePlugins.forEach(function(plugin) {
      plugin.serviceChecks.forEach(function(pluginCheck) {
        self.servicesMonitor.addCheck(pluginCheck.checkName, pluginCheck.checkFn, pluginCheck.time);
      });
    });
  }
  this.servicesMonitor.startMonitor();
};

Engine.prototype.startService = function(serviceName, _options) {
  let options = _options || {};

  let services = {
    "pipeline":    this.pipelineService,
    "abi":         this.abiService,
    "deployment":  this.deploymentService,
    "fileWatcher": this.fileWatchService,
    "webServer":   this.webServerService,
    "ipfs":        this.ipfsService,
    "web3":        this.web3Service
  };

  let service = services[serviceName];

  if (!service) {
    throw new Error("unknown service: " + serviceName);
  }

  // need to be careful with circular references due to passing the web3 object
  //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
  return service.apply(this, [options]);
};

Engine.prototype.pipelineService = function(options) {
  let self = this;
  this.logger.setStatus("Building Assets");
  let pipeline = new Pipeline({
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
  let self = this;
  let generateABICode = function(contractsManager) {
    let abiGenerator = new ABIGenerator({
      blockchainConfig: self.config.blockchainConfig,
      contractsManager: contractsManager,
      plugins: self.plugins,
      storageConfig: self.config.storageConfig,
      communicationConfig: self.config.communicationConfig
    });
    let embarkJSABI = abiGenerator.generateABI({useEmbarkJS: true});
    let vanillaABI = abiGenerator.generateABI({useEmbarkJS: false});
    let vanillaContractsABI = abiGenerator.generateContracts(false);

    self.events.emit('abi-contracts-vanila', vanillaContractsABI);
    self.events.emit('abi-vanila', vanillaABI);
    self.events.emit('abi', embarkJSABI);
  };
  this.events.on('contractsDeployed', generateABICode);
  this.events.on('blockchainDisabled', generateABICode);
};

Engine.prototype.deploymentService = function(options) {
  let self = this;
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
  let watch = new Watch({logger: this.logger, events: this.events});
  watch.start();
};

Engine.prototype.webServerService = function(options) {
  let self = this;
  let webServerConfig = this.config.webServerConfig;
  if (!webServerConfig.enabled) { return; }

  let host = options.host || webServerConfig.host;
  let port = options.port  || webServerConfig.port;

  this.logger.setStatus("Starting Server");
  let server = new Server({
    logger: this.logger,
    host: host,
    port: port
  });

  self.servicesMonitor.addCheck('Webserver', function(cb) {
    let devServer = 'Webserver (http://' + host + ':' + port + ')';
    return cb({name: devServer, status: 'green'});
  });

  server.start(function(){
  });
};

Engine.prototype.ipfsService = function(options) {
  let self = this;
  self.servicesMonitor.addCheck('IPFS', function(cb) {
    utils.checkIsAvailable('http://localhost:5001', function(available) {
      if (available) {
        //Ideally this method should be in an IPFS API JSONRPC wrapper
        //The URL should also be flexible to accept non-default IPFS url
        self.logger.trace("Checking IPFS version...");
        http.get('http://localhost:5001/api/v0/version', function(res) {
          let body = '';
          res.on('data', function(d) {
            body += d;
          });
          res.on('end', function() {
            try{
              let parsed = JSON.parse(body);
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
  let self = this;
  this.web3 = options.web3;
  if (this.web3 === undefined) {
    this.web3 = new Web3();
    let web3Endpoint = 'http://' + this.config.blockchainConfig.rpcHost + ':' + this.config.blockchainConfig.rpcPort;
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
