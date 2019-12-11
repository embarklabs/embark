import {
  Config,
  Events,
  IPC,
  Plugins,
  ProcessManager,
  ServicesMonitor
} from 'embark-core';
import { normalizeInput } from 'embark-utils';
import { Logger } from 'embark-logger';

const EMBARK_PROCESS_NAME = 'embark';

export class Engine {

  env: string;

  client: string;

  locale: string;

  embarkConfig: any;

  interceptLogs: boolean;

  version: string;

  logFile: string;

  logLevel: string;

  events: Events;

  context: any;

  useDashboard: boolean;

  webServerConfig: any;

  webpackConfigName: string;

  singleUseAuthToken: boolean;

  ipcRole = 'client';

  logger: Logger;

  config: Config | undefined;

  plugins: Plugins | undefined;

  ipc: IPC | undefined;

  processManager: ProcessManager | undefined;

  servicesMonitor: ServicesMonitor | undefined;

  package: any;

  isDev: boolean | undefined;

  constructor(options) {
    this.env = options.env;
    this.client = options.client;
    this.locale = options.locale;
    this.embarkConfig = options.embarkConfig;
    this.interceptLogs = options.interceptLogs;
    this.version = options.version;
    this.logFile = options.logFile;
    this.logLevel = options.logLevel;
    this.logger = options.logger;
    this.events = options.events;
    this.context = options.context;
    this.useDashboard = options.useDashboard;
    this.webServerConfig = options.webServerConfig;
    this.webpackConfigName = options.webpackConfigName;
    this.singleUseAuthToken = options.singleUseAuthToken;
    this.package = options.package;
    this.ipcRole = options.ipcRole || 'client';
  }

  init(_options, callback) {
    callback = callback || (() => {});

    const options = _options || {};
    this.events = options.events || this.events || new Events();
    this.logger = this.logger || new Logger({context: this.context, logLevel: options.logLevel || this.logLevel || 'info', events: this.events, logFile: this.logFile});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events, context: this.context, webServerConfig: this.webServerConfig, version: this.version, package: this.package});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;
    this.isDev = this.config && this.config.blockchainConfig && (this.config.blockchainConfig.isDev || this.config.blockchainConfig.default);

    if (this.interceptLogs || this.interceptLogs === undefined) {
      interceptLogs(console, this.logger);
    }

    this.ipc = new IPC({ logger: this.logger, ipcRole: this.ipcRole });
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

  loadDappPlugins() {
    if (this.config) {
      this.config.plugins.loadPlugins();
      this.config.reloadConfig();
    }
  }

  startEngine(cb) {
    if (this.plugins) {
      this.plugins.emitAndRunActionsForEvent("embark:engine:started", {}, (err) => {
        if (err) {
          return cb(err);
        }
        cb();
      });
    } else {
      cb();
    }
  }

  registerModule(moduleName, options) {
    if (this.plugins) {
      this.plugins.loadInternalPlugin(require.resolve(moduleName), options || {});
    }
  }

  registerModulePackage(moduleName, options?: any) {
    if (this.plugins) {
      return this.plugins.loadInternalPlugin(require.resolve(moduleName), options || {}, true);
    }
  }

  registerModuleGroup(groupName, _options) {
    const options = _options || {};

    const groups = {
      blockchain: this.blockchainComponents,
      coreComponents: this.coreComponents,
      stackComponents: this.stackComponents,
      consoleComponents: this.consoleComponents,
      blockchainStackComponents: this.blockchainStackComponents,
      compiler: this.compilerComponents,
      contracts: this.contractsComponents,
      pipeline: this.pipelineService,
      webserver: this.webserverService,
      storage: this.storageComponent,
      communication: this.communicationComponents,
      namesystem: this.namesystemComponents,
      filewatcher: this.filewatcherService,
      tests: this.testComponents,
      cockpit: this.cockpitModules
    };

    const group = groups[groupName];

    if (!group) {
      throw new Error("unknown service: " + groupName);
    }

    // need to be careful with circular references due to passing the web3 object
    // this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return group.apply(this, [options]);
  }

  webserverService(_options) {
    this.registerModulePackage('embark-webserver');
  }

  filewatcherService(_options) {
    this.registerModulePackage('embark-watcher');
  }

  pipelineService(_options) {
    this.registerModulePackage('embark-basic-pipeline', {
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

    this.servicesMonitor = new ServicesMonitor({ events: this.events, logger: this.logger, plugins: this.plugins });

    if (this.servicesMonitor) {
      this.servicesMonitor.addCheck('Embark', (cb) => {
        return cb({ name: 'Embark ' + this.version, status: 'on' });
      }, 0);

      if (this.plugins) {
        const plugin = this.plugins.createPlugin('coreservicesplugin', {});
        plugin.registerActionForEvent("embark:engine:started", (_params, cb) => {
          if (this.servicesMonitor) { this.servicesMonitor.startMonitor(); }
          cb();
        });
      }
    }

    this.registerModulePackage('embark-code-runner', { ipc: this.ipc });

    // TODO: we shouldn't need useDashboard
    this.registerModulePackage('embark-library-manager', { useDashboard: this.useDashboard });
  }

  consoleComponents() {
    // TODO: suggestions should be moved to their own module
    this.registerModulePackage('embark-console', {
      events: this.events,
      plugins: this.plugins,
      version: this.version,
      ipc: this.ipc,
      logger: this.logger,
      config: this.config
    });
    this.registerModulePackage('embark-plugin-cmd');
  }

  blockchainStackComponents() {
    this.registerModulePackage('embark-blockchain', { plugins: this.plugins, ipc: this.ipc });
    this.registerModulePackage('embark-blockchain-client');
    this.registerModulePackage('embark-process-logs-api-manager');
  }

  stackComponents(options) {
    this.registerModulePackage('embark-pipeline', { plugins: this.plugins });
    this.registerModulePackage('embark-blockchain', { plugins: this.plugins, ipc: this.ipc });
    this.registerModulePackage('embark-proxy', { plugins: this.plugins });
    // TODO: coverage param should be part of the request compilation command, not an option here
    // some other params in the options might not longer be relevant, in fact we probably don't need options anymore
    this.registerModulePackage('embark-compiler', { plugins: this.plugins, isCoverage: options.isCoverage });
    this.registerModulePackage('embark-contracts-manager', { plugins: this.plugins, compileOnceOnly: options.compileOnceOnly });
    this.registerModulePackage('embark-deployment', { plugins: this.plugins, onlyCompile: options.onlyCompile });
    this.registerModulePackage('embark-blockchain-client');
    this.registerModulePackage('embark-storage');
    this.registerModulePackage('embark-communication');
    this.registerModulePackage('embark-namesystem');
    this.registerModulePackage('embark-process-logs-api-manager');
    this.registerModulePackage('embark-embarkjs', { plugins: this.plugins });
  }

  blockchainComponents() {
    // plugins
    this.registerModulePackage('embark-geth', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      plugins: this.plugins,
      ipc: this.ipc
    });
    this.registerModulePackage('embark-parity', {
      client: this.client,
      locale: this.locale,
      isDev: this.isDev,
      plugins: this.plugins,
      ipc: this.ipc
    });
  }

  testComponents(options) {
    this.registerModulePackage('embark-test-runner', { plugins: this.plugins, ipc: this.ipc });
    this.registerModulePackage('embark-coverage', { plugins: this.plugins, coverage: options.coverage });
    this.registerModulePackage('embark-solidity-tests', { plugins: this.plugins, coverage: options.coverage });
    this.registerModulePackage('embark-mocha-tests', { plugins: this.plugins, coverage: options.coverage });
  }

  compilerComponents(_options) {
    // TODO: should be moved (they are plugins)
    this.registerModulePackage('embark-solidity', { ipc: this.ipc, useDashboard: this.useDashboard });
    this.registerModulePackage('embark-vyper');
  }

  contractsComponents(_options) {
    this.registerModulePackage('embark-ganache');
    this.registerModulePackage('embark-ethereum-blockchain-client');
    this.registerModulePackage('embark-web3');
    this.registerModulePackage('embark-accounts-manager');
    this.registerModulePackage('embark-rpc-manager');
    this.registerModulePackage('embark-specialconfigs', { plugins: this.plugins });
    this.registerModulePackage('embark-transaction-logger');
    this.registerModulePackage('embark-transaction-tracker');
    this.registerModulePackage('embark-profiler');
  }

  storageComponent() {
    this.registerModulePackage('embark-ipfs');
    this.registerModulePackage('embark-swarm');
  }

  communicationComponents() {
    this.registerModulePackage('embark-whisper-geth');
    this.registerModulePackage('embark-whisper-parity');
  }

  namesystemComponents() {
    this.registerModulePackage('embark-ens');
  }

  cockpitModules() {
    this.registerModulePackage('embark-authenticator', { singleUseAuthToken: this.singleUseAuthToken });
    this.registerModulePackage('embark-api', { plugins: this.plugins });
    // Register logs for the cockpit console
    this.events.request('process:logs:register', { processName: EMBARK_PROCESS_NAME, eventName: "log", silent: false, alwaysAlreadyLogged: true });
  }
}

function interceptLogs(consoleContext, logger) {
  const context: any = {};
  context.console = consoleContext;

  context.console.log = () => {
    logger.info(normalizeInput(arguments));
  };
  context.console.warn = () => {
    logger.warn(normalizeInput(arguments));
  };
  context.console.info = () => {
    logger.info(normalizeInput(arguments));
  };
  context.console.debug = () => {
    // TODO: ue JSON.stringify
    logger.debug(normalizeInput(arguments));
  };
  context.console.trace = () => {
    logger.trace(normalizeInput(arguments));
  };
  context.console.dir = () => {
    logger.dir(normalizeInput(arguments));
  };
}
