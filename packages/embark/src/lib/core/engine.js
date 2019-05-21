import { __ } from 'embark-i18n';
import { ProcessManager, IPC } from 'embark-core';
const async = require('async');

const utils = require('../utils/utils');
const Logger = require('embark-logger');

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
    this.singleUseAuthToken = options.singleUseAuthToken;
    this.ipcRole = options.ipcRole || 'client';
  }

  init(_options, callback) {
    callback = callback || function() {};
    const Events = require('./events.js');
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

  registerModulePackage(moduleName, options) {
    this.plugins.loadInternalPlugin(moduleName, options || {}, true);
  }

  startService(serviceName, _options) {
    let options = _options || {};

    let services = {
      "serviceMonitor": this.serviceMonitor,
      "pipeline": this.pipelineService,
      "cockpit": this.cockpitService,
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
    this.registerModulePackage('embark-listener');
  }

  blockchainListenerService(_options){
    this.registerModulePackage('embark-blockchain-listener', {
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
    this.processManager = new ProcessManager({
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });
  }

  graphService(_options) {
    this.registerModulePackage('embark-graph');
  }

  scaffoldingService(_options) {
    this.registerModulePackage('embark-scaffolding',  {plugins: this.plugins});
  }

  pipelineService(_options) {
    const self = this;
    this.registerModulePackage('embark-pipeline', {
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
    this.registerModulePackage('embark-plugin-cmd', {embarkConfigFile: this.embarkConfig, embarkConfig: this.config.embarkConfig, packageFile: 'package.json'});
  }

  console(_options) {
    this.registerModulePackage('embark-console', {
      events: this.events,
      plugins: this.plugins,
      version: this.version,
      ipc: this.ipc,
      logger: this.logger,
      config: this.config
    });
  }

  codeRunnerService(_options) {
    this.registerModulePackage('embark-code-runner', {
      ipc: this.ipc
    });
  }

  codeGeneratorService(_options) {
    let self = this;

    this.registerModulePackage('embark-code-generator', {plugins: self.plugins, env: self.env});

    const generateCode = function (modifiedAssets) {
      self.events.request("module:storage:onReady", () => {
        self.events.request("code-generator:embarkjs:build", () => {
          self.events.emit('code-generator-ready', modifiedAssets);
        });
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
    this.registerModulePackage('embark-compiler', {plugins: this.plugins, isCoverage: options.isCoverage});
    this.registerModulePackage('embark-solidity', {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModulePackage('embark-vyper');
    this.registerModulePackage('embark-contracts-manager', {plugins: this.plugins, compileOnceOnly: options.compileOnceOnly});
  }

  deploymentService(options) {
    let self = this;

    this.setupCompilerAndContractsManagerService(options);
    this.registerModulePackage('embark-solidity', {ipc: self.ipc, useDashboard: this.useDashboard});
    this.registerModulePackage('embark-vyper');
    this.registerModulePackage('embark-profiler');
    this.registerModulePackage('embark-deploy-tracker', {trackContracts: options.trackContracts});
    this.registerModulePackage('embark-specialconfigs');
    this.registerModulePackage('embark-ens');
    this.registerModulePackage('embark-console-listener', {ipc: self.ipc});
    this.registerModulePackage('embark-deployment', {plugins: this.plugins, onlyCompile: options.onlyCompile});
    this.registerModulePackage('embark-transaction-tracker');
    this.registerModulePackage('embark-debugger');

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
          self.events.request('deploy:contracts', (err) => {
            if (err) {
              self.logger.error(err.message || err);
            }
          });
        }
      }, 50);
    });
  }

  fileWatchService() {
    this.registerModulePackage('embark-watcher');
    this.events.request('watcher:start');
  }

  cockpitService() {
    this.registerModulePackage('embark-authenticator', {singleUseAuthToken: this.singleUseAuthToken});
    this.registerModulePackage('embark-api', {plugins: this.plugins});
  }

  webServerService() {
    this.registerModulePackage('embark-webserver');
  }

  storageService(_options) {
    async.parallel([
      (next) => {
        if (!this.config.storageConfig.available_providers.includes("ipfs")) {
          return next();
        }
        this.events.once("ipfs:process:started", next);
        this.registerModule('ipfs');
      },
      (next) => {
        if (!this.config.storageConfig.available_providers.includes("swarm")) {
          return next();
        }
        this.events.once("swarm:process:started", next);
        this.registerModule('swarm');
      }
    ], (err) => {
      if(err) {
        console.error(__("Error starting storage process(es): %s", err));
      }
      this.registerModule('storage', {plugins: this.plugins});
    });
  }

  web3Service(options) {
    this.registerModulePackage('embark-blockchain-process', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      ipc: this.ipc
    });

    this.registerModulePackage('embark-blockchain-connector', {
      isDev: this.isDev,
      locale: this.locale,
      plugins: this.plugins,
      web3: options.web3,
      wait: options.wait
    });

    this.registerModulePackage('embark-whisper');
  }

  libraryManagerService(_options) {
    this.registerModulePackage('embark-library-manager', {useDashboard: this.useDashboard});
  }

  codeCoverageService(_options) {
    this.registerModulePackage('embark-coverage');
  }

  testRunnerService(options) {
    this.registerModulePackage('embark-test-runner', Object.assign(options, {ipc: this.ipc}));
  }

}

module.exports = Engine;
