import {ProcessManager, IPC} from 'embark-core';

const utils = require('../utils/utils');
const Logger = require('embark-logger');

const EMBARK_PROCESS_NAME = 'embark';

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
    callback = callback || function () {};
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

  startEngine(cb) {
    this.plugins.emitAndRunActionsForEvent("embark:engine:started", {}, (err) => {
      if (err) {
        console.error("error starting engine");
        console.error(err);
        process.exit(1);
      }
      cb();
    });
  }

  registerModule(moduleName, options) {
    this.plugins.loadInternalPlugin(moduleName, options || {});
  }

  registerModulePackage(moduleName, options) {
    return this.plugins.loadInternalPlugin(moduleName, options || {}, true);
  }

  registerModuleGroup(groupName, _options) {
    let options = _options || {};

    let groups = {
      "blockchain": this.blockchainComponents,
      "coreComponents": this.coreComponents,
      "stackComponents": this.stackComponents,
      "compiler": this.compilerComponents,
      "contracts": this.contractsComponents,
      "pipeline": this.pipelineService,
      "webserver": this.webserverService,
      "storage": this.storageComponent,
      "communication": this.communicationComponents,
      "namesystem": this.namesystemComponents,
      "filewatcher": this.filewatcherService,
      "tests": this.testComponents,
      cockpit: this.cockpitModules
    };

    let group = groups[groupName];

    if (!group) {
      throw new Error("unknown service: " + groupName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return group.apply(this, [options]);
  }

  webserverService(_options) {
    this.registerModulePackage('embark-webserver');
  }

  filewatcherService(_options) {
    this.registerModulePackage('embark-watcher');
  }

  pipelineService(_options) {
    this.registerModule('basic-pipeline', {
      plugins: this.plugins,
      webpackConfigName: this.webpackConfigName,
      useDashboard: this.useDashboard
    });
  }

  coreComponents() {
    // TODO: should be made into a component
    this.processManager = new ProcessManager({
      events: this.events,
      logger: this.logger,
      plugins: this.plugins
    });

    const ServicesMonitor = require('./services_monitor.js');
    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger, plugins: this.plugins});
    this.servicesMonitor.addCheck('Embark', (cb) => {
      return cb({name: 'Embark ' + this.version, status: 'on'});
    }, 0);

    let plugin = this.plugins.createPlugin('coreservicesplugin', {});
    plugin.registerActionForEvent("embark:engine:started", (_params, cb) => {
      this.servicesMonitor.startMonitor();
      cb();
    });
    this.registerModulePackage('embark-code-runner', {ipc: this.ipc});
    // TODO: suggestions should be moved to their own module
    this.registerModulePackage('embark-console', {
      events: this.events,
      plugins: this.plugins,
      version: this.version,
      ipc: this.ipc,
      logger: this.logger,
      config: this.config
    });


    // TODO: we shouldn't need useDashboard
    this.registerModulePackage('embark-library-manager', {useDashboard: this.useDashboard});
  }

  stackComponents(options) {
    this.registerModulePackage('embark-pipeline', { plugins: this.plugins });
    this.registerModule('blockchain', { plugins: this.plugins });
    this.registerModulePackage('embark-proxy', {plugins: this.plugins});
    // TODO: coverage param should be part of the request compilation command, not an option here
    // some other params in the options might not longer be relevant, in fact we probably don't need options anymore
    this.registerModulePackage('embark-compiler', {plugins: this.plugins, isCoverage: options.isCoverage});
    this.registerModulePackage('embark-contracts-manager', {plugins: this.plugins, compileOnceOnly: options.compileOnceOnly});
    this.registerModulePackage('embark-deployment', {plugins: this.plugins, onlyCompile: options.onlyCompile});
    this.registerModule('blockchain-client');
    this.registerModulePackage('embark-storage');
    this.registerModule('communication');
    this.registerModulePackage('embark-namesystem');
    this.registerModulePackage('embark-process-logs-api-manager');
    this.registerModule('embark-embarkjs', {plugins: this.plugins});
  }

  blockchainComponents() {
    // plugins
    this.registerModule('geth', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      plugins: this.plugins,
      ipc: this.ipc
    });
    this.registerModule('parity', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      plugins: this.plugins,
      ipc: this.ipc
    });
  }

  testComponents() {
    this.registerModulePackage('embark-test-runner');
    this.registerModulePackage('embark-solidity-tests');
    this.registerModulePackage('embark-mocha-tests');
  }

  compilerComponents(_options) {
    // TODO: should be moved (they are plugins)
    this.registerModulePackage('embark-solidity', {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModulePackage('embark-vyper');
  }

  contractsComponents(_options) {
  //   this.registerModulePackage('embark-blockchain-connector', {
  //     isDev: this.isDev,
  //     locale: this.locale,
  //     plugins: this.plugins,
  //     web3: options.web3,
  //     wait: options.wait
  //   });

    this.registerModule('ethereum-blockchain-client');
    // this.registerModule('web3', { plugins: this.plugins });
    this.registerModulePackage('embark-web3');
    this.registerModulePackage('embark-accounts-manager');
    this.registerModulePackage('embark-specialconfigs', {plugins: this.plugins});
    this.registerModulePackage('embark-transaction-logger');
    this.registerModulePackage('embark-transaction-tracker');
  }

  storageComponent() {
    this.registerModulePackage('embark-ipfs');
    this.registerModulePackage('embark-swarm');
  }

  communicationComponents() {
    this.registerModulePackage('embark-whisper');
  }

  namesystemComponents() {
    this.registerModulePackage('embark-ens');
  }

  // ================
  // ================
  // ================
  // To be removed
  // ================

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
      "blockchain": this.blockchainComponents
    };

    let service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  embarkListenerService(_options)  {
    this.registerModulePackage('embark-listener');
  }

  blockchainListenerService(_options) {
    this.registerModulePackage('embark-blockchain-listener', {
      ipc: this.ipc
    });
  }

  coreProcessService(_options) {
    this.registerModulePackage('embark-core/process', {
      events: this.events
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
    this.registerModulePackage('embark-scaffolding', {plugins: this.plugins});
  }

  serviceMonitor() {
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

  codeRunnerService(_options) {
    this.registerModulePackage('embark-code-runner', {
      ipc: this.ipc
    });
  }

  codeGeneratorService(_options) {
    return;
    // let self = this;
    //
    // this.registerModulePackage('embark-code-generator', {plugins: self.plugins, env: self.env});
    //
    // const generateCode = function (modifiedAssets) {
    // // self.events.request("module:storage:onReady", () => {
    // self.events.request("code-generator:embarkjs:build", () => {
    // self.events.emit('code-generator-ready', modifiedAssets);
    // });
    // // });
    // };
    // const cargo = async.cargo((tasks, callback) => {
    // const modifiedAssets = tasks.map(task => task.modifiedAsset).filter(asset => asset); // filter null elements
    // generateCode(modifiedAssets);
    // self.events.once('outputDone', callback);
    // });
    // const addToCargo = function (modifiedAsset) {
    // cargo.push({modifiedAsset});
    // };
    //
    // this.events.on('contractsDeployed', addToCargo);
    // this.events.on('blockchainDisabled', addToCargo);
    // this.events.on('asset-changed', addToCargo);
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
    this.registerModulePackage('embark-console-listener', {ipc: self.ipc});
    this.registerModulePackage('embark-deployment', {plugins: this.plugins, onlyCompile: options.onlyCompile});
    this.registerModulePackage('embark-transaction-tracker');
    this.registerModulePackage('embark-debugger');
  }

  fileWatchService() {
    this.registerModulePackage('embark-watcher');
    this.events.request('watcher:start');
  }

  cockpitService() {
    this.registerModulePackage('embark-authenticator', {singleUseAuthToken: this.singleUseAuthToken});
    this.registerModulePackage('embark-api', {plugins: this.plugins});
  }

  cockpitModules() {
    this.registerModulePackage('embark-authenticator', {singleUseAuthToken: this.singleUseAuthToken});
    this.registerModulePackage('embark-api', {plugins: this.plugins});
    // Register logs for the cockpit console
    this.events.request('process:logs:register', {processName: EMBARK_PROCESS_NAME, eventName: "log", silent: false, alwaysAlreadyLogged: true});
  }

  webServerService() {
    this.registerModulePackage('embark-webserver');
  }

  storageService(_options) {
    this.registerModulePackage('embark-storage', {plugins: this.plugins});
    this.registerModulePackage('embark-ipfs');
    this.registerModulePackage('embark-swarm');
    // this.registerModulePackage('embark-swarm');

    // this.events.setCommandHandler("module:storage:reset", (cb) => {
    //   async.parallel([
    //     (paraCb) => {
    //       this.events.request("module:ipfs:reset", paraCb);
    //     },
    //     (paraCb) => {
    //       this.events.request("module:swarm:reset", paraCb);
    //     },
    //     (paraCb) => {
    //       this.events.request("module:storageJS:reset", paraCb);
    //     }
    //   ], cb);
    // });
  }

  web3Service(options) {
    this.registerModulePackage('embark-web3', {plugins: this.plugins});

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

    this.registerModulePackage('embark-whisper', {plugins: this.plugins});
    this.registerModule('web3', {plugins: this.plugins});
  }

  libraryManagerService(_options) {
    return this.registerModulePackage('embark-library-manager', {useDashboard: this.useDashboard});
  }

  codeCoverageService(_options) {
    this.registerModulePackage('embark-coverage');
  }

  testRunnerService(options) {
    this.registerModulePackage('embark-test-runner', Object.assign(options, {ipc: this.ipc}));
  }

}

module.exports = Engine;
