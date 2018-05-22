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
const request = require('request');

const ProcessLauncher = require('../process/processLauncher');
const utils = require('../utils/utils');
const constants = require('../constants');

const STARTING_BLOCKCHAIN = 'startBlockchain';

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
      // this.doInterceptLogs();
    }
  }

  normalizeInput(input) {
    let args = Object.values(input);
    if (args.length === 0) {
      return "";
    }
    if (args.length === 1) {
      if (Array.isArray(args[0])) { return args[0].join(','); }
      return args[0] || "";
    }
    return ('[' + args.map((x) => {
      if (x === null) { return "null"; }
      if (x === undefined) { return "undefined"; }
      if (Array.isArray(x)) { return x.join(','); }
      return x;
    }).toString() + ']');
  }

  doInterceptLogs() {
    var self = this;
    let context = {};
    context.console = console;

    context.console.log  = function() {
      self.logger.info(self.normalizeInput(arguments));
    };
    context.console.warn  = function() {
      self.logger.warn(self.normalizeInput(arguments));
    };
    context.console.info  = function() {
      self.logger.info(self.normalizeInput(arguments));
    };
    context.console.debug  = function() {
      // TODO: ue JSON.stringify
      self.logger.debug(self.normalizeInput(arguments));
    };
    context.console.trace  = function() {
      self.logger.trace(self.normalizeInput(arguments));
    };
    context.console.dir  = function() {
      self.logger.dir(self.normalizeInput(arguments));
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
      normalizeInput: this.normalizeInput,
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
      communicationConfig: self.config.communicationConfig,
      events: self.events
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
    if (!options.web3) {
      // Web3 object might have been modified
      self.onReady(() => {
        self.deployManager.web3 = self.web3;
      });
    }


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

  onReady(callback) {
    if (this.isReady) {
      return callback();
    }
    this.events.once(constants.blockchain.engineReady, () => {
      callback();
    });
  }

  checkWeb3Status(web3Endpoint, callback) {
    const self = this;
    const NO_NODE = 'noNode';
    const noNodeObj = {name: __("No Blockchain node found"), status: 'off'};
    async.waterfall([
      function checkCurrentProvider(next) {
        if (self.web3.currentProvider === undefined) {
          return next(NO_NODE);
        }
        next();
      },
      function pingWeb3Endpoint(next) {
        // FIXME: this is needed currently because the provider (MetaMask/provider-engine) doesn't callback when there is no node
        request.get(web3Endpoint, function (err, _response, _body) {
          if (err) {
            return next(NO_NODE);
          }
          next();
        });
      },
      function checkAccount(next) {
        self.web3.eth.getAccounts(function(err, _accounts) {
          if (err) {
            return next(NO_NODE);
          }
          next();
        });
      },
      function getWeb3ClientVersion(next) {
        // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
        self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
          if (err) {
            return next({name: __("Ethereum node (version unknown)"), status: 'on'});
          }
          if (version.indexOf("/") < 0) {
            return next({name: version, status: 'on'});
          }
          let nodeName = version.split("/")[0];
          let versionNumber = version.split("/")[1].split("-")[0];
          let name = nodeName + " " + versionNumber + " (Ethereum)";

          return next({name: name, status: 'on'});
        });
      }
    ], (msg) => {
      if (msg === NO_NODE) {
        if (self.isRunningBlockchain) {
          return callback(noNodeObj);
        }
        // Start blockchain node ourselves
        self.stopWeb3Service();
        self.startBlockchainNode();
        return callback(STARTING_BLOCKCHAIN);
      }
      if (!self.isReady) {
        self.isReady = true;
        self.events.emit(constants.blockchain.engineReady);
      }
      callback(msg);
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

  stopWeb3Service() {
    this.servicesMonitor.stopCheck('Ethereum');
    if (this.provider) {
      this.provider.stop();
    }
    this.web3 = null;
  }

  startBlockchainNode() {
    this.logger.info('Starting Blockchain node in another process'.cyan);
    this.isRunningBlockchain = true;

    this.blockchainProcess = new ProcessLauncher({
      modulePath: utils.joinPath(__dirname, '../cmds/blockchain/blockchainProcess.js'),
      logger: this.logger,
      events: this.events,
      normalizeInput: this.normalizeInput,
      silent: true
    });
    this.blockchainProcess.send({
      action: constants.blockchain.init, options: {
        blockchainConfig: this.config.blockchainConfig,
        client: this.client,
        env: this.env,
        isDev: this.isDev,
        locale: this.locale
      }
    });

    this.blockchainProcess.once('result', constants.blockchain.blockchainReady, () => {
      this.logger.info('Blockchain node is ready'.cyan);
      this.startService('web3');
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
