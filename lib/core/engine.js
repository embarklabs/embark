let Web3 = require('web3');
let Events = require('./events.js');
let Logger = require('./logger.js');
let Config = require('./config.js');
let DeployManager = require('../contracts/deploy_manager.js');
let CodeGenerator = require('../contracts/code_generator.js');
let ServicesMonitor = require('./services_monitor.js');
let Pipeline = require('../pipeline/pipeline.js');
let Watch = require('../pipeline/watch.js');
let LibraryManager = require('../versions/library_manager.js');

class Engine {
  constructor(options) {
    this.env = options.env;
    this.embarkConfig = options.embarkConfig;
    this.interceptLogs = options.interceptLogs;
    this.version = options.version;
  }

  init(_options) {
    let self = this;
    let options = _options || {};
    this.events = new Events();
    this.logger = options.logger || new Logger({logLevel: options.logLevel || 'debug'});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;

    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger});
    this.servicesMonitor.addCheck('embarkVersion', function (cb) {
      return cb({name: 'Embark ' + self.version, status: 'on'});
    }, 0);
  }

  startMonitor() {
    let self = this;
    if (this.plugins) {
      // --------
      // TODO: this only works for services done on startup
      // --------
      let servicePlugins = this.plugins.getPluginsFor('serviceChecks');
      servicePlugins.forEach(function (plugin) {
        plugin.serviceChecks.forEach(function (pluginCheck) {
          self.servicesMonitor.addCheck(pluginCheck.checkName, pluginCheck.checkFn, pluginCheck.time);
        });
      });
    }
    this.servicesMonitor.startMonitor();
  }

  registerModule(moduleName, options) {
    this.plugins.loadInternalPlugin(moduleName, options);
  }

  startService(serviceName, _options) {
    let options = _options || {};

    let services = {
      "pipeline": this.pipelineService,
      "codeGenerator": this.codeGeneratorService,
      "deployment": this.deploymentService,
      "fileWatcher": this.fileWatchService,
      "webServer": this.webServerService,
      "ipfs": this.ipfsService,
      "web3": this.web3Service,
      "libraryManager": this.libraryManagerService
    };

    let service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  pipelineService(_options) {
    let self = this;
    this.logger.setStatus("Building Assets");
    let pipeline = new Pipeline({
      buildDir: this.config.buildDir,
      contractsFiles: this.config.contractsFiles,
      assetFiles: this.config.assetFiles,
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });
    this.events.on('code-generator-ready', function () {
      self.events.request('code', function (abi, contractsJSON) {
        self.currentAbi = abi;
        self.contractsJSON = contractsJSON;
        pipeline.build(abi, contractsJSON, null, function() {
          self.events.emit('outputDone');
        });
      });
    });
    // TODO: still need to redeploy contracts because the original contracts
    // config is being corrupted
    //this.events.on('file-event', function(fileType, path) {
    //  if (fileType === 'asset') {
    //    self.config.reloadConfig();
    //    pipeline.build(self.abi, self.contractsJSON, path);
    //    self.events.emit('outputDone');
    //  }
    //});
  }

  codeGeneratorService(_options) {
    let self = this;
    let generateCode = function (contractsManager) {
      let codeGenerator = new CodeGenerator({
        blockchainConfig: self.config.blockchainConfig,
        contractsConfig: self.config.contractsConfig,
        contractsManager: contractsManager,
        plugins: self.plugins,
        storageConfig: self.config.storageConfig,
        communicationConfig: self.config.communicationConfig,
        events: self.events
      });
      codeGenerator.listenToCommands();
      codeGenerator.buildEmbarkJS();

      self.events.emit('code-generator-ready');
    };
    this.events.on('contractsDeployed', generateCode);
    this.events.on('blockchainDisabled', generateCode);
  }

  deploymentService(options) {
    let self = this;

    this.registerModule('solidity', {
      contractDirectories: self.config.contractDirectories
    });

    this.deployManager = new DeployManager({
      web3: options.web3 || self.web3,
      trackContracts: options.trackContracts,
      config: this.config,
      logger: this.logger,
      plugins: this.plugins,
      events: this.events
    });

    this.events.on('file-event', function (_fileType, _path) {
      // TODO: for now need to deploy on asset chanes as well
      // because the contractsManager config is corrupted after a deploy
      //if (fileType === 'contract' || fileType === 'config') {
      self.config.reloadConfig();
      self.deployManager.deployContracts(function () {
      });
      //}
    });
  }

  fileWatchService(_options) {
    this.logger.setStatus("Watching for changes");
    let watch = new Watch({logger: this.logger, events: this.events});
    watch.start();
  }

  webServerService() {
    this.registerModule('webserver', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor)
    });
  }

  ipfsService(_options) {
    this.registerModule('ipfs', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      storageConfig: this.config.storageConfig,
      host: _options.host,
      port: _options.port
    });
  }

  web3Service(options) {
    let self = this;
    this.web3 = options.web3;
    if (this.web3 === undefined) {
      this.web3 = new Web3();
      if (this.config.contractsConfig.deployment.type === "rpc") {
        let web3Endpoint = 'http://' + this.config.contractsConfig.deployment.host + ':' + this.config.contractsConfig.deployment.port;
        this.web3.setProvider(new this.web3.providers.HttpProvider(web3Endpoint));
      } else {
        throw new Error("contracts config error: unknown deployment type " + this.config.contractsConfig.deployment.type);
      }
    }

    self.servicesMonitor.addCheck('Ethereum', function (cb) {
      if (self.web3.isConnected()) {
        return cb({
          name: (self.web3.version.node.split("/")[0] + " " + self.web3.version.node.split("/")[1].split("-")[0] + " (Ethereum)"),
          status: 'on'
        });
      } else {
        return cb({name: "No Blockchain node found", status: 'off'});
      }
    });

    this.registerModule('whisper', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      communicationConfig: this.config.communicationConfig,
      web3: this.web3
    });
  }

  libraryManagerService(options) {
    let libraryManager = new LibraryManager({
      plugins: this.plugins,
      config: this.config
    });
  }

}

module.exports = Engine;
