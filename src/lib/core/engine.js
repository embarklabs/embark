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
    this.webpackConfigName = options.webpackConfigName;
    this.ipcRole = options.ipcRole || 'client';
  }

  init(_options, callback) {
    callback = callback || function() {};
    const Events = require('./events.js');
    const Logger = require('./logger.js');
    const Config = require('./config.js');

    let options = _options || {};
    this.events = options.events || this.events || new Events();
    this.logger = options.logger || new Logger({context: this.context, logLevel: options.logLevel || this.logLevel || 'debug', events: this.events, logFile: this.logFile});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events, context: this.context, webServerConfig: this.webServerConfig, version: this.version});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;
    this.isDev = this.config && this.config.blockchainConfig && (this.config.blockchainConfig.isDev || this.config.blockchainConfig.default);

    if (this.interceptLogs || this.interceptLogs === undefined) {
      utils.interceptLogs(console, this.logger);
    }

    this.ipc = new IPC({logger: this.logger, ipcRole: this.ipcRole});
    if (this.ipc.isClient()) {
      return this.ipc.connect((_err) => {
        callback();
      });
    } else if (this.ipc.isServer()) {
      this.ipc.serve();
      return callback();
    }
    callback();
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
      "compiler": this.setupCompilerAndContractsManagerService,
      "deployment": this.deploymentService,
      "fileWatcher": this.fileWatchService,
      "webServer": this.webServerService,
      "console": this.console,
      "web3": this.web3Service,
      "libraryManager": this.libraryManagerService,
      "processManager": this.processManagerService,
      "storage": this.storageService,
      "pluginCommand": this.pluginCommandService,
      "graph": this.graphService,
      "testRunner": this.testRunnerService,
      "codeCoverage": this.codeCoverageService,
      "scaffolding": this.scaffoldingService,
      "coreProcess": this.coreProcessService,
      "processApi": this.processApiService,
      "blockchainListener": this.blockchainListenerService,
      "embarkListener": this.embarkListenerService
    };

    let service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  embarkListenerService(_options){
    this.registerModule('embark_listener');
  }

  blockchainListenerService(_options){
    this.registerModule('blockchain_listener', {
      ipc: this.ipc
    });
  }

  coreProcessService(_options){
    this.registerModule('core_process', {
      events: this.events
    });
  }

  processApiService(_options){
    this.registerModule('process_api', {
      logger: this.logger
    });
  }

  processManagerService(_options) {
    const ProcessManager = require('./processes/processManager.js');
    this.processManager = new ProcessManager({
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });
  }

  graphService(_options) {
    this.registerModule('graph');
  }

  scaffoldingService(_options) {
    this.registerModule('scaffolding',  {plugins: this.plugins});
  }

  pipelineService(_options) {
    const self = this;
    this.registerModule('pipeline', {
      webpackConfigName: this.webpackConfigName,
      useDashboard: this.useDashboard
    });
    this.events.on('code-generator-ready', function (modifiedAssets) {
      self.events.request('code', function (abi, contractsJSON) {
        self.events.request('pipeline:build', {abi, contractsJSON, modifiedAssets}, () => {
          self.events.emit('outputDone');
        });
      });
    });
  }

  serviceMonitor() {
    const self = this;
    const ServicesMonitor = require('./services_monitor.js');
    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger, plugins: this.plugins});
    this.servicesMonitor.addCheck('Embark', function (cb) {
      return cb({name: 'Embark ' + self.version, status: 'on'});
    }, 0);
    this.servicesMonitor.startMonitor();
  }

  pluginCommandService() {
    this.registerModule('plugin_cmd', {embarkConfigFile: this.embarkConfig, embarkConfig: this.config.embarkConfig, packageFile: 'package.json'});
  }

  console(options) {
    this.registerModule('console', {
      events: this.events,
      plugins: this.plugins,
      version: this.version,
      ipc: this.ipc,
      logger: this.logger,
      config: this.config,
      forceRegister: options.forceRegister
    });
    this.registerModule('authenticator');
  }

  codeRunnerService(_options) {
    const CodeRunner = require('./modules/coderunner/codeRunner.js');
    this.codeRunner = new CodeRunner({
      config: this.config,
      plugins: this.plugins,
      events: this.events,
      logger: this.logger,
      ipc: this.ipc
    });
  }

  codeGeneratorService(_options) {
    let self = this;

    this.registerModule('code_generator', {plugins: self.plugins, env: self.env});

    const generateCode = function (modifiedAssets) {
      self.events.request("code-generator:embarkjs:build", () => {
        self.events.emit('code-generator-ready', modifiedAssets);
      });
    };
    const cargo = async.cargo((tasks, callback) => {
      const modifiedAssets = tasks.map(task => task.modifiedAsset).filter(asset => asset); // filter null elements
      generateCode(modifiedAssets);
      self.events.once('outputDone', callback);
    });
    const addToCargo = function (modifiedAsset) {
      cargo.push({modifiedAsset});
    };

    this.events.on('contractsDeployed', addToCargo);
    this.events.on('blockchainDisabled', addToCargo);
    this.events.on('asset-changed', addToCargo);
  }

  setupCompilerAndContractsManagerService(options) {
    this.registerModule('compiler', {plugins: this.plugins, disableOptimizations: options.disableOptimizations});
    this.registerModule('solidity', {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModule('vyper');
    this.registerModule('contracts_manager', {plugins: this.plugins, compileOnceOnly: options.compileOnceOnly});
  }

  deploymentService(options) {
    let self = this;

    this.setupCompilerAndContractsManagerService(options);
    this.registerModule('solidity', {ipc: self.ipc, useDashboard: this.useDashboard});
    this.registerModule('vyper');
    this.registerModule('profiler', {plugins: this.plugins});
    this.registerModule('deploytracker', {trackContracts: options.trackContracts});
    this.registerModule('specialconfigs');
    this.registerModule('ens');
    this.registerModule('console_listener', {ipc: self.ipc});
    this.registerModule('deployment', {plugins: this.plugins, onlyCompile: options.onlyCompile});
    this.registerModule('transactionTracker');
    this.registerModule('debugger');

    this.events.on('file-event', function ({fileType, path}) {
      clearTimeout(self.fileTimeout);
      self.fileTimeout = setTimeout(() => {
        // TODO: still need to redeploy contracts because the original contracts
        // config is being corrupted
        self.config.reloadConfig();

        if (fileType === 'asset') {
          // Throttle file changes so we re-write only once for all files
          self.events.emit('asset-changed', path);
        }
        // TODO: for now need to deploy on asset changes as well
        // because the contractsManager config is corrupted after a deploy
        if (fileType === 'contract' || fileType === 'config') {
          self.events.request('deploy:contracts', () => {});
        }
      }, 50);
    });
  }

  fileWatchService() {
    this.registerModule('watcher');
    this.events.request('watcher:start');
  }

  webServerService() {
    this.registerModule('webserver', {plugins: this.plugins});
  }

  storageService(_options) {
    this.registerModule('storage', {plugins: this.plugins});
    this.registerModule('ipfs');
    this.registerModule('swarm');
  }

  web3Service(options) {
    this.registerModule('blockchain_process', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      ipc: this.ipc
    });

    this.registerModule('blockchain_connector', {
      isDev: this.isDev,
      locale: this.locale,
      plugins: this.plugins,
      web3: options.web3,
      wait: options.wait
    });

    this.registerModule('whisper', options);
  }

  libraryManagerService(_options) {
    this.registerModule('library_manager', {useDashboard: this.useDashboard});
  }

  codeCoverageService(_options) {
    this.registerModule('coverage');
  }

  testRunnerService(options) {
    this.registerModule('tests', Object.assign(options, {ipc: this.ipc}));
  }

}

module.exports = Engine;
