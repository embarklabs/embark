const async = require('async');

const Events = require('./events.js');
const Logger = require('./logger.js');
const Config = require('./config.js');
const Blockchain = require('../contracts/blockchain.js');
const Compiler = require('../contracts/compiler.js');
const ContractsManager = require('../contracts/contracts.js');
const DeployManager = require('../contracts/deploy_manager.js');
const CodeGenerator = require('../contracts/code_generator.js');
const ServicesMonitor = require('./services_monitor.js');
const Pipeline = require('../pipeline/pipeline.js');
const Watch = require('../pipeline/watch.js');
const LibraryManager = require('../versions/library_manager.js');
const CodeRunner = require('../coderunner/codeRunner.js');
const utils = require('../utils/utils');

class Engine {
  constructor(options) {
    this.env = options.env;
    this.isDev = options.isDev;
    this.client = options.client;
    this.locale = options.locale;
    this.embarkConfig = options.embarkConfig;
    this.interceptLogs = options.interceptLogs;
    this.version = options.version;
    this.logFile = options.logFile;
    this.logLevel = options.logLevel;
    this.events = options.events;
    this.context = options.context;
  }

  init(_options) {
    let self = this;
    let options = _options || {};
    this.events = options.events || this.events || new Events();
    this.logger = options.logger || new Logger({logLevel: options.logLevel || this.logLevel || 'debug', events: this.events, logFile: this.logFile});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events, context: this.context});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;

    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger});
    this.servicesMonitor.addCheck('embarkVersion', function (cb) {
      return cb({name: 'Embark ' + self.version, status: 'on'});
    }, 0);

    if (this.interceptLogs || this.interceptLogs === undefined) {
      this.doInterceptLogs();
    }
  }

  doInterceptLogs() {
    var self = this;
    let context = {};
    context.console = console;

    context.console.log  = function() {
      self.logger.info(utils.normalizeInput(arguments));
    };
    context.console.warn  = function() {
      self.logger.warn(utils.normalizeInput(arguments));
    };
    context.console.info  = function() {
      self.logger.info(utils.normalizeInput(arguments));
    };
    context.console.debug  = function() {
      // TODO: ue JSON.stringify
      self.logger.debug(utils.normalizeInput(arguments));
    };
    context.console.trace  = function() {
      self.logger.trace(utils.normalizeInput(arguments));
    };
    context.console.dir  = function() {
      self.logger.dir(utils.normalizeInput(arguments));
    };
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
      "codeRunner": this.codeRunnerService,
      "codeGenerator": this.codeGeneratorService,
      "deployment": this.deploymentService,
      "fileWatcher": this.fileWatchService,
      "webServer": this.webServerService,
      "namingSystem": this.namingSystem,
      "ipfs": this.ipfsService,
      "web3": this.web3Service,
      "libraryManager": this.libraryManagerService,
      "swarm": this.swarmService
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
    const self = this;
    this.events.emit("status", "Building Assets");
    const pipeline = new Pipeline({
      buildDir: this.config.buildDir,
      contractsFiles: this.config.contractsFiles,
      assetFiles: this.config.assetFiles,
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });

    this.events.on('code-generator-ready', function () {
      self.events.request('code', function (abi, contractsJSON) {
        pipeline.build(abi, contractsJSON, null, () => {
          if (self.watch) {
            self.watch.restart(); // Necessary because changing a file while it is writing can stop it from being watched
          }
          self.events.emit('outputDone');
        });
      });
    });
  }

  namingSystem(_options) {
    this.registerModule('ens', {
      logger: this.logger,
      events: this.events,
      web3: this.blockchain.web3,
      namesConfig: this.config.namesystemConfig
    });
  }

  codeRunnerService(_options) {
    this.codeRunner = new CodeRunner({
      plugins: this.plugins,
      events: this.events,
      logger: this.logger
    });
  }

  codeGeneratorService(_options) {
    let self = this;

    this.codeGenerator = new CodeGenerator({
      blockchainConfig: self.config.blockchainConfig,
      contractsConfig: self.config.contractsConfig,
      contractsManager: this.contractsManager,
      plugins: self.plugins,
      storageConfig: self.config.storageConfig,
      namesystemConfig: self.config.namesystemConfig,
      communicationConfig: self.config.communicationConfig,
      events: self.events,
      env: self.env
    });
    this.codeGenerator.listenToCommands();

    const generateCode = function () {
      self.codeGenerator.buildEmbarkJS(function() {
        self.events.emit('code-generator-ready');
      });
    };
    const cargo = async.cargo((tasks, callback) => {
      generateCode(tasks[tasks.length - 1].contractsManager);
      self.events.once('outputDone', callback);
    });
    const addToCargo = function (contractsManager) {
      cargo.push({contractsManager});
    };

    this.events.on('contractsDeployed', addToCargo);
    this.events.on('blockchainDisabled', addToCargo);
    this.events.on('asset-changed', addToCargo);
  }

  deploymentService(options) {
    let self = this;

    let compiler = new Compiler({plugins: self.plugins, logger: self.logger});
    this.events.setCommandHandler("compiler:contracts", function(contractFiles, cb) {
      compiler.compile_contracts(contractFiles, cb);
    });

    this.registerModule('solidity', {
      contractDirectories: self.config.contractDirectories
    });
    this.registerModule('vyper', {
      contractDirectories: self.config.contractDirectories
    });
    this.registerModule('profiler', {
      events: this.events,
      logger: this.logger
    });

    this.registerModule('deploytracker', {
    });

    this.registerModule('specialconfigs', {
    });

    this.contractsManager = new ContractsManager({
      contractFiles: this.config.contractsFiles,
      contractsConfig: this.config.contractsConfig,
      logger: this.logger,
      plugins: this.plugins,
      gasLimit: false,
      events: this.events
    });

    this.deployManager = new DeployManager({
      blockchain: this.blockchain,
      trackContracts: options.trackContracts,
      config: this.config,
      logger: this.logger,
      plugins: this.plugins,
      events: this.events,
      contractsManager: this.contractsManager,
      onlyCompile: options.onlyCompile
    });

    this.events.on('file-event', function (fileType) {
      clearTimeout(self.fileTimeout);
      self.fileTimeout = setTimeout(() => {
        // TODO: still need to redeploy contracts because the original contracts
        // config is being corrupted
        if (fileType === 'asset') {
          // Throttle file changes so we re-write only once for all files
          self.events.emit('asset-changed', self.contractsManager);
        }
        // TODO: for now need to deploy on asset changes as well
        // because the contractsManager config is corrupted after a deploy
        if (fileType === 'contract' || fileType === 'config') {
          self.config.reloadConfig();
          self.deployManager.deployContracts(function () {
          });
        }
      }, 50);
    });
  }

  fileWatchService(_options) {
    this.events.emit("status", "Watching for changes");
    this.watch = new Watch({logger: this.logger, events: this.events});
    this.watch.start();
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

  swarmService(_options) {
    this.registerModule('swarm', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      storageConfig: this.config.storageConfig,
      // TODO: this should not be needed and should be deducted from the config instead
      // the eth provider is not necessary the same as the swarm one
      bzz: this.blockchain.web3.bzz
    });
  }

  web3Service(options) {
    this.blockchain = new Blockchain({
      contractsConfig: this.config.contractsConfig,
      blockchainConfig: this.config.blockchainConfig,
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      events: this.events,
      logger: this.logger,
      isDev: this.isDev,
      locale: this.locale,
      web3: options.web3
    });

    this.registerModule('whisper', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      communicationConfig: this.config.communicationConfig,
      // TODO: this should not be needed and should be deducted from the config instead
      // the eth provider is not necessary the same as the whisper one
      web3: this.blockchain.web3
    });
  }

  libraryManagerService(_options) {
    this.libraryManager = new LibraryManager({
      plugins: this.plugins,
      config: this.config
    });
  }

}

module.exports = Engine;
