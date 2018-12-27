import async from "async";

const utils = require("../utils/utils");
const IPC = require("./ipc");

class Engine {
  private env: any;
  private client: any;
  private locale: any;
  private embarkConfig: any;
  private interceptLogs: any;
  private version: any;
  private logFile: any;
  private logLevel: any;
  private events: any;
  private context: any;
  private useDashboard: any;
  private webServerConfig: any;
  private webpackConfigName: any;
  private ipcRole: any;
  private logger: any;
  private config: any;
  private plugins: any;
  private isDev: any;
  private ipc: any;
  private fileTimeout: any;
  private codeRunner: any;
  private servicesMonitor: any;
  private processManager: any;

  constructor(options: any) {
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
    this.ipcRole = options.ipcRole || "client";
  }

  public init(_options: any, callback: any) {
    callback = callback || (() => {});
    const Events = require("./events.js");
    const Logger = require("./logger.js");
    const Config = require("./config.js");

    const options = _options || {};
    this.events = options.events || this.events || new Events();
    this.logger = options.logger || new Logger({context: this.context, logLevel: options.logLevel || this.logLevel || "debug", events: this.events, logFile: this.logFile});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events, context: this.context, webServerConfig: this.webServerConfig});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;
    this.isDev = this.config && this.config.blockchainConfig && (this.config.blockchainConfig.isDev || this.config.blockchainConfig.default);

    if (this.interceptLogs || this.interceptLogs === undefined) {
      utils.interceptLogs(console, this.logger);
    }

    this.ipc = new IPC({logger: this.logger, ipcRole: this.ipcRole});
    if (this.ipc.isClient()) {
      return this.ipc.connect((_err: any) => {
        callback();
      });
    } else if (this.ipc.isServer()) {
      this.ipc.serve();
      return callback();
    }
    callback();
  }

  private registerModule(moduleName: string, options?: any) {
    this.plugins.loadInternalPlugin(moduleName, options || {});
  }

  public startService(serviceName: string, _options?: any) {
    const options: any = _options || {};

    const services: any = {
      blockchainListener: this.blockchainListenerService,
      codeCoverage: this.codeCoverageService,
      codeGenerator: this.codeGeneratorService,
      codeRunner: this.codeRunnerService,
      compiler: this.setupCompilerAndContractsManagerService,
      console: this.console,
      coreProcess: this.coreProcessService,
      deployment: this.deploymentService,
      embarkListener: this.embarkListenerService,
      fileWatcher: this.fileWatchService,
      graph: this.graphService,
      libraryManager: this.libraryManagerService,
      pipeline: this.pipelineService,
      pluginCommand: this.pluginCommandService,
      processApi: this.processApiService,
      processManager: this.processManagerService,
      scaffolding: this.scaffoldingService,
      serviceMonitor: this.serviceMonitor,
      storage: this.storageService,
      testRunner: this.testRunnerService,
      web3: this.web3Service,
      webServer: this.webServerService,
    };

    const service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    // this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  private embarkListenerService(_options?: any) {
    this.registerModule("embark_listener");
  }

  private blockchainListenerService(_options?: any) {
    this.registerModule("blockchain_listener", { ipc: this.ipc });
  }

  private coreProcessService(_options?: any) {
    this.registerModule("core_process", { events: this.events });
  }

  private processApiService(_options?: any) {
    this.registerModule("process_api", { logger: this.logger });
  }

  private processManagerService(_options?: any) {
    const ProcessManager = require("./processes/processManager.js").default;
    this.processManager = new ProcessManager({
      events: this.events,
      logger: this.logger,
      plugins: this.plugins,
    });
  }

  private graphService(_options?: any) {
    this.registerModule("graph");
  }

  private scaffoldingService(_options?: any) {
    this.registerModule("scaffolding", {plugins: this.plugins});
  }

  private pipelineService(_options?: any) {
    this.registerModule("pipeline", {
      useDashboard: this.useDashboard,
      webpackConfigName: this.webpackConfigName,
    });
    this.events.on("code-generator-ready", (modifiedAssets: any) => {
      this.events.request("code", (abi: any, contractsJSON: any) => {
        this.events.request("pipeline:build", {abi, contractsJSON, modifiedAssets}, () => {
          this.events.emit("outputDone");
        });
      });
    });
  }

  private serviceMonitor() {
    const ServicesMonitor = require("./services_monitor.js");
    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger, plugins: this.plugins});
    this.servicesMonitor.addCheck("Embark", (cb: any) => {
      return cb({name: "Embark " + this.version, status: "on"});
    }, 0);
    this.servicesMonitor.startMonitor();
  }

  private pluginCommandService() {
    this.registerModule("plugin_cmd", {embarkConfigFile: this.embarkConfig, embarkConfig: this.config.embarkConfig, packageFile: "package.json"});
  }

  private console(options?: any) {
    this.registerModule("console", {
      config: this.config,
      events: this.events,
      forceRegister: options.forceRegister,
      ipc: this.ipc,
      logger: this.logger,
      plugins: this.plugins,
      version: this.version,
    });
    this.registerModule("authenticator");
  }

  private codeRunnerService(_options?: any) {
    const CodeRunner = require("./modules/coderunner/codeRunner.js");
    this.codeRunner = new CodeRunner({
      config: this.config,
      events: this.events,
      ipc: this.ipc,
      logger: this.logger,
      plugins: this.plugins,
    });
  }

  private codeGeneratorService(_options?: any) {
    this.registerModule("code_generator", {plugins: this.plugins, env: this.env});

    const generateCode = (modifiedAssets: any) => {
      this.events.request("code-generator:embarkjs:build", () => {
        this.events.emit("code-generator-ready", modifiedAssets);
      });
    };
    const cargo = async.cargo((tasks: any, callback: any) => {
      const modifiedAssets = tasks.map((task: any) => task.modifiedAsset).filter((asset: any) => asset); // filter null elements
      generateCode(modifiedAssets);
      this.events.once("outputDone", callback);
    });
    const addToCargo = (modifiedAsset: any) => {
      cargo.push({modifiedAsset});
    };

    this.events.on("contractsDeployed", addToCargo);
    this.events.on("blockchainDisabled", addToCargo);
    this.events.on("asset-changed", addToCargo);
  }

  private setupCompilerAndContractsManagerService(options?: any) {
    this.registerModule("compiler", {plugins: this.plugins, disableOptimizations: options.disableOptimizations});
    this.registerModule("solidity", {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModule("vyper");
    this.registerModule("contracts_manager", {plugins: this.plugins, compileOnceOnly: options.compileOnceOnly});
  }

  private deploymentService(options?: any) {
    this.setupCompilerAndContractsManagerService(options);
    this.registerModule("solidity", {ipc: this.ipc, useDashboard: this.useDashboard});
    this.registerModule("vyper");
    this.registerModule("profiler", {plugins: this.plugins});
    this.registerModule("deploytracker", {trackContracts: options.trackContracts});
    this.registerModule("specialconfigs");
    this.registerModule("ens");
    this.registerModule("console_listener", {ipc: this.ipc});
    this.registerModule("deployment", {plugins: this.plugins, onlyCompile: options.onlyCompile});
    this.registerModule("transactionTracker");
    this.registerModule("debugger");

    this.events.on("file-event", ({fileType, path}: any) => {
      clearTimeout(this.fileTimeout);
      this.fileTimeout = setTimeout(() => {
        // TODO: still need to redeploy contracts because the original contracts
        // config is being corrupted
        this.config.reloadConfig();

        if (fileType === "asset") {
          // Throttle file changes so we re-write only once for all files
          this.events.emit("asset-changed", path);
        }
        // TODO: for now need to deploy on asset changes as well
        // because the contractsManager config is corrupted after a deploy
        if (fileType === "contract" || fileType === "config") {
          this.events.request("deploy:contracts", () => {});
        }
      }, 50);
    });
  }

  private fileWatchService() {
    this.registerModule("watcher");
    this.events.request("watcher:start");
  }

  private webServerService() {
    this.registerModule("webserver", {plugins: this.plugins});
  }

  private storageService(_options?: any) {
    this.registerModule("storage", {plugins: this.plugins});
    this.registerModule("ipfs");
    this.registerModule("swarm");
  }

  private web3Service(options?: any) {
    this.registerModule("blockchain_process", {
      client: this.client,
      ipc: this.ipc,
      isDev: this.isDev,
      locale: this.locale,
    });

    this.registerModule("blockchain_connector", {
      isDev: this.isDev,
      locale: this.locale,
      plugins: this.plugins,
      wait: options.wait,
      web3: options.web3,
    });

    this.registerModule("whisper", options);
  }

  private libraryManagerService(_options?: any) {
    this.registerModule("library_manager", {useDashboard: this.useDashboard});
  }

  private codeCoverageService(_options?: any) {
    this.registerModule("coverage");
  }

  private testRunnerService(options?: any) {
    this.registerModule("tests", Object.assign(options, {ipc: this.ipc}));
  }

}

export default Engine;
