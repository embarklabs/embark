const Web3 = require('web3');
const Events = require('./events.js');
const Logger = require('./logger.js');
const Config = require('./config.js');
const ContractsManager = require('../contracts/contracts.js');
const DeployManager = require('../contracts/deploy_manager.js');
const CodeGenerator = require('../contracts/code_generator.js');
const ServicesMonitor = require('./services_monitor.js');
const Watch = require('../pipeline/watch.js');
const LibraryManager = require('../versions/library_manager.js');
const utils = require('../utils/utils');
const constants = require('../constants');
const async = require('async');
const fs = require('../core/fs.js');

class Engine {
  constructor(options) {
    this.env = options.env;
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
    let self = this;
    self.events.emit("status", "Building Assets");
    const pipelineProcess = require('child_process').fork(utils.joinPath(__dirname, '../pipeline/pipeline.js'));

    async.waterfall([
      function getWeb3Version(next) {
        console.log('Waiting for web3 version');
        self.events.request("version:get:web3", function(web3Version) {
          console.log('Web3 version', web3Version);
          next(null, web3Version);
        });
      },
      function getWeb3Location(web3Version, next) {
        if (web3Version === "1.0.0-beta") {
          return next(null, utils.joinPath(fs.embarkPath("js/web3-1.0.min.js")));
        } else {
          self.events.request("version:getPackageLocation", "web3", web3Version, function(err, location) {
            return next(err, fs.dappPath(location));
          });
        }
      },
      function getProviderCode(web3Location, next) {
        self.events.once('code-generator-ready', function () {
          self.events.request('provider-code', function(providerCode) {
            next(null, web3Location, providerCode);
          });
        });
      }
    ], (err, web3Location, providerCode) => {
      if (err) {
        return self.logger.error(err);
      }

      // Setup Pipeline
      pipelineProcess.send({action: constants.pipeline.init, options: {
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles,
          events: self.events,
          pipelinePlugins: self.plugins.getPluginsFor('pipeline'),
          pluginImports: self.plugins.getPluginsProperty('imports', 'imports'),
          web3Location,
          providerCode
        }});

      pipelineProcess.on('message', function (msg) {
        if (msg.result === constants.pipeline.built) {
          if (self.watch) {
            self.watch.restart(); // Necessary because changing a file while it is writing can stop it from being watched
          }
          return self.events.emit('outputDone');
        }

        if (msg.result === constants.pipeline.log) {
          self.logger.debug(self.normalizeInput(msg.message));
        }
      });

      function build() {
        self.events.request('code', function (abi, contractsJSON) {
          self.currentAbi = abi;
          self.contractsJSON = contractsJSON;
          pipelineProcess.send({action: constants.pipeline.build, abi, contractsJSON, path: null});
        });
      }

      self.events.on('code-generator-ready', function () {
        build();
      });

      build();
    });
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
      console.log('LISTEN TO COMMANDS');
      codeGenerator.listenToCommands();
      codeGenerator.buildEmbarkJS(function() {
        self.events.emit('code-generator-ready');
      });
    };
    this.events.on('contractsDeployed', generateCode);
    this.events.on('blockchainDisabled', generateCode);
    this.events.on('asset-changed', generateCode);
  }

  deploymentService(options) {
    let self = this;

    this.registerModule('solidity', {
      contractDirectories: self.config.contractDirectories
    });
    this.registerModule('vyper', {
      contractDirectories: self.config.contractDirectories
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
      web3: options.web3 || self.web3,
      trackContracts: options.trackContracts,
      config: this.config,
      logger: this.logger,
      plugins: this.plugins,
      events: this.events,
      contractsManager: this.contractsManager,
      onlyCompile: options.onlyCompile
    });

    this.events.on('file-event', function (fileType) {
      // TODO: still need to redeploy contracts because the original contracts
      // config is being corrupted
      if (fileType === 'asset') {
        self.events.emit('asset-changed', self.contractsManager);
      }
      // TODO: for now need to deploy on asset chanes as well
      // because the contractsManager config is corrupted after a deploy
      if (fileType === 'contract' || fileType === 'config') {
        self.config.reloadConfig();
        self.deployManager.deployContracts(function () {
        });
      }
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
      bzz: _options.bzz
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
      if (self.web3.currentProvider === undefined) {
        return cb({name: "No Blockchain node found", status: 'off'});
      }

      self.web3.eth.getAccounts(function(err, _accounts) {
        if (err) {
          return cb({name: "No Blockchain node found", status: 'off'});
        }

        // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
        self.web3._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
          if (err) {
            return cb({name: "Ethereum node (version unknown)", status: 'on'});
          }
          if (version.indexOf("/") < 0) {
            return cb({name: version, status: 'on'});
          }
          let nodeName = version.split("/")[0];
          let versionNumber = version.split("/")[1].split("-")[0];
          let name = nodeName + " " + versionNumber + " (Ethereum)";

          return cb({name: name, status: 'on'});
        });
      });
    });

    this.registerModule('whisper', {
      addCheck: this.servicesMonitor.addCheck.bind(this.servicesMonitor),
      communicationConfig: this.config.communicationConfig,
      web3: this.web3
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
