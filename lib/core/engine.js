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
    this.ipcRole = options.ipcRole;
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
      utils.interceptLogs(console, this.logger);
    }

    this.ipc = new IPC({logger: this.logger, ipcRole: this.ipcRole});
    if (this.ipc.isServer()) {
      this.ipc.serve();
    }
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
      "graph": this.graphService,
      "codeCoverage": this.codeCoverageService
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
      logger: this.logger,
      ipc: this.ipc
    });
  }

  codeGeneratorService(_options) {
    let self = this;

    this.registerModule('code_generator', {plugins: self.plugins, env: self.env});

    const generateCode = function () {
      self.events.request("code-generator:embarkjs:build", () => {
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
    this.registerModule('solidity', {ipc: self.ipc, useDashboard: this.useDashboard});
    this.registerModule('vyper');
    this.registerModule('profiler');
    this.registerModule('deploytracker');
    this.registerModule('specialconfigs');
    this.registerModule('specialconfigs');
    this.registerModule('console_listener', {ipc: self.ipc});
    this.registerModule('contracts_manager');
    this.registerModule('deployment', {plugins: this.plugins, onlyCompile: options.onlyCompile});

    this.events.on('file-event', function (fileType) {
      clearTimeout(self.fileTimeout);
      self.fileTimeout = setTimeout(() => {
        // TODO: still need to redeploy contracts because the original contracts
        // config is being corrupted
        self.config.reloadConfig();
        if (fileType === 'asset') {
          // Throttle file changes so we re-write only once for all files
          self.events.emit('asset-changed', self.contractsManager);
        }
        // TODO: for now need to deploy on asset changes as well
        // because the contractsManager config is corrupted after a deploy
        if (fileType === 'contract' || fileType === 'config') {
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

    this.registerModule('blockchain_connector', {
      isDev: this.isDev,
      web3: options.web3
    });

    this.registerModule('whisper');
  }

  libraryManagerService(_options) {
    this.registerModule('library_manager');
  }

  codeCoverageService(_options) {
    this.registerModule('coverage');
  }
}

module.exports = Engine;
