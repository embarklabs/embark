const async = require('async');

const utils = require('../utils/utils');
const IPC = require('./ipc');

class Engine {
  constructor(options) {
    this.env = options.env;
    this.client = options.client;
    this.locale = options.locale;
    this.embarkConfig = options.embarkConfig;
    this.interceptLogs = options.interceptLogs;
    this.version = options.version;
    this.logFile = options.logFile;
    this.logLevel = options.logLevel;
    this.events = options.events;
    this.context = options.context;
    this.useDashboard = options.useDashboard;
    this.webServerConfig = options.webServerConfig;
  }

  init(_options) {
    const Events = require('./events.js');
    const Logger = require('./logger.js');
    const Config = require('./config.js');

    let options = _options || {};
    this.events = options.events || this.events || new Events();
    this.logger = options.logger || new Logger({logLevel: options.logLevel || this.logLevel || 'debug', events: this.events, logFile: this.logFile});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events, context: this.context, webServerConfig: this.webServerConfig});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;
    this.isDev = this.config && this.config.blockchainConfig && (this.config.blockchainConfig.isDev || this.config.blockchainConfig.default);

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

  registerModule(moduleName, options) {
    this.plugins.loadInternalPlugin(moduleName, options || {});
  }

  startService(serviceName, _options) {
    let options = _options || {};

    let services = {
      "serviceMonitor": this.serviceMonitor,
      "pipeline": this.pipelineService,
      "codeRunner": this.codeRunnerService,
      "codeGenerator": this.codeGeneratorService,
      "deployment": this.deploymentService,
      "fileWatcher": this.fileWatchService,
      "webServer": this.webServerService,
      "namingSystem": this.namingSystem,
      "web3": this.web3Service,
      "libraryManager": this.libraryManagerService,
      "processManager": this.processManagerService,
      "storage": this.storageService,
      "graph": this.graphService
    };

    let service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  processManagerService(_options) {
    const ProcessManager = require('../processes/processManager.js');
    this.processManager = new ProcessManager({
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });
  }

  graphService(_options) {
    this.registerModule('graph', {engine: this});
  }

  pipelineService(_options) {
    const self = this;
    this.events.emit("status", "Building Assets");
    const Pipeline = require('../pipeline/pipeline.js');
    const pipeline = new Pipeline({
      env: this.env,
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
          self.events.emit('outputDone');
        });
      });
    });
  }

  serviceMonitor() {
    const self = this;
    const ServicesMonitor = require('./services_monitor.js');
    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger, plugins: this.plugins});
    this.servicesMonitor.addCheck('embarkVersion', function (cb) {
      return cb({name: 'Embark ' + self.version, status: 'on'});
    }, 0);
    this.servicesMonitor.startMonitor();
  }

  namingSystem(_options) {
    this.registerModule('ens');
  }

  codeRunnerService(_options) {
    const CodeRunner = require('./modules/coderunner/codeRunner.js');
    this.codeRunner = new CodeRunner({
      plugins: this.plugins,
      events: this.events,
      logger: this.logger
    });
  }

  codeGeneratorService(_options) {
    let self = this;

    const CodeGenerator = require('../contracts/code_generator.js');
    this.codeGenerator = new CodeGenerator({
      blockchainConfig: self.config.blockchainConfig,
      contractsConfig: self.config.contractsConfig,
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
    const cargo = async.cargo((_tasks, callback) => {
      generateCode();
      self.events.once('outputDone', callback);
    });
    const addToCargo = function () {
      cargo.push({});
    };

    this.events.on('contractsDeployed', addToCargo);
    this.events.on('blockchainDisabled', addToCargo);
    this.events.on('asset-changed', addToCargo);
  }

  deploymentService(options) {
    let self = this;

    this.registerModule('compiler', {plugins: self.plugins});

    this.ipc = new IPC({logger: this.logger, ipcRole: options.ipcRole});
    if (this.ipc.isServer()) {
      this.ipc.serve();
    }

    this.registerModule('solidity', {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModule('vyper');
    this.registerModule('profiler');
    this.registerModule('deploytracker');
    this.registerModule('specialconfigs');
    this.registerModule('console_listener', {ipc: this.ipc});

    const ContractsManager = require('../contracts/contracts.js');
    this.contractsManager = new ContractsManager({
      contractFiles: this.config.contractsFiles,
      contractsConfig: this.config.contractsConfig,
      logger: this.logger,
      plugins: this.plugins,
      gasLimit: false,
      events: this.events
    });

    const DeployManager = require('../contracts/deploy_manager.js');
    this.deployManager = new DeployManager({
      blockchain: this.blockchain,
      config: this.config,
      logger: this.logger,
      plugins: this.plugins,
      events: this.events,
      onlyCompile: options.onlyCompile
    });

    const ContractDeployer = require('../contracts/contract_deployer.js');
    this.contractDeployer = new ContractDeployer({
      blockchain: this.blockchain,
      logger: this.logger,
      events: this.events,
      plugins: this.plugins
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

          self.events.request('deploy:contracts', () => {});
        }
      }, 50);
    });
  }

  fileWatchService(_options) {
    this.events.emit("status", "Watching for changes");
    const Watch = require('../pipeline/watch.js');
    this.watch = new Watch({logger: this.logger, events: this.events});
    this.watch.start();
  }

  webServerService(_options) {
    this.registerModule('webserver', _options);
  }

  storageService(_options) {
    this.registerModule('storage', {plugins: this.plugins});
    this.registerModule('ipfs');
    this.registerModule('swarm');
  }

  web3Service(options) {
    this.registerModule('blockchain_process', {
      locale: this.locale,
      isDev: this.isDev
    });

    const Blockchain = require('../contracts/blockchain.js');
    this.blockchain = new Blockchain({
      contractsConfig: this.config.contractsConfig,
      blockchainConfig: this.config.blockchainConfig,
      events: this.events,
      logger: this.logger,
      isDev: this.isDev,
      locale: this.locale,
      web3: options.web3
    });

    this.registerModule('whisper', {
      // TODO: this should not be needed and should be deducted from the config instead
      // the eth provider is not necessary the same as the whisper one
      web3: this.blockchain.web3
    });
  }

  libraryManagerService(_options) {
    const LibraryManager = require('../versions/library_manager.js');
    this.libraryManager = new LibraryManager({
      plugins: this.plugins,
      config: this.config
    });
  }

}

module.exports = Engine;
