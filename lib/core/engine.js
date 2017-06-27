let Web3 = require('web3');
let utils = require('../utils/utils.js');
let Events = require('./events.js');
let Logger = require('./logger.js');
let Config = require('./config.js');
let DeployManager = require('../contracts/deploy_manager.js');
let ABIGenerator = require('../contracts/abi.js');
let ServicesMonitor = require('./services_monitor.js');
let Pipeline = require('../pipeline/pipeline.js');
let Server = require('../pipeline/server.js');
let Watch = require('../pipeline/watch.js');

class Engine {
  constructor(options) {
    this.env = options.env;
    this.embarkConfig = options.embarkConfig;
    this.interceptLogs = options.interceptLogs;
    this.version = options.version;
  }

  init(_options) {
    let self = this;
    let options = _options || {};
    this.events = new Events();
    this.logger = options.logger || new Logger({logLevel: options.logLevel || 'debug'});
    this.config = new Config({env: this.env, logger: this.logger, events: this.events});
    this.config.loadConfigFiles({embarkConfig: this.embarkConfig, interceptLogs: this.interceptLogs});
    this.plugins = this.config.plugins;

    this.servicesMonitor = new ServicesMonitor({events: this.events, logger: this.logger});
    this.servicesMonitor.addCheck('embarkVersion', function (cb) {
      return cb({name: 'Embark ' + self.version, status: 'on'});
    }, 0);
  }

  startMonitor() {
    let self = this;
    if (this.plugins) {
      let servicePlugins = this.plugins.getPluginsFor('serviceChecks');
      servicePlugins.forEach(function (plugin) {
        plugin.serviceChecks.forEach(function (pluginCheck) {
          self.servicesMonitor.addCheck(pluginCheck.checkName, pluginCheck.checkFn, pluginCheck.time);
        });
      });
    }
    this.servicesMonitor.startMonitor();
  }

  startService(serviceName, _options) {
    let options = _options || {};

    let services = {
      "pipeline": this.pipelineService,
      "abi": this.abiService,
      "deployment": this.deploymentService,
      "fileWatcher": this.fileWatchService,
      "webServer": this.webServerService,
      "ipfs": this.ipfsService,
      "web3": this.web3Service
    };

    let service = services[serviceName];

    if (!service) {
      throw new Error("unknown service: " + serviceName);
    }

    // need to be careful with circular references due to passing the web3 object
    //this.logger.trace("calling: " + serviceName + "(" + JSON.stringify(options) + ")");
    return service.apply(this, [options]);
  }

  pipelineService(options) {
    let self = this;
    this.logger.setStatus("Building Assets");
    let pipeline = new Pipeline({
      buildDir: this.config.buildDir,
      contractsFiles: this.config.contractsFiles,
      assetFiles: this.config.assetFiles,
      logger: this.logger,
      plugins: this.plugins
    });
    this.events.on('abi', function (abi, contractsJSON) {
      self.currentAbi = abi;
      self.contractsJSON = contractsJSON;
      pipeline.build(abi, contractsJSON);
      self.events.emit('outputDone');
    });
    // TODO: still need to redeploy contracts because the original contracts
    // config is being corrupted
    //this.events.on('file-event', function(fileType, path) {
    //  if (fileType === 'asset') {
    //    self.config.reloadConfig();
    //    pipeline.build(self.abi, self.contractsJSON, path);
    //    self.events.emit('outputDone');
    //  }
    //});
  }

  abiService(options) {
    let self = this;
    let generateABICode = function (contractsManager) {
      let abiGenerator = new ABIGenerator({
        blockchainConfig: self.config.blockchainConfig,
        contractsManager: contractsManager,
        plugins: self.plugins,
        storageConfig: self.config.storageConfig,
        communicationConfig: self.config.communicationConfig
      });
      let embarkJSABI = abiGenerator.generateABI({useEmbarkJS: true});
      let vanillaABI = abiGenerator.generateABI({useEmbarkJS: false});
      let vanillaContractsABI = abiGenerator.generateContracts(false);
      let contractsJSON = abiGenerator.generateContractsJSON();

      self.events.emit('abi-contracts-vanila', vanillaContractsABI, contractsJSON);
      self.events.emit('abi-vanila', vanillaABI, contractsJSON);
      self.events.emit('abi', embarkJSABI, contractsJSON);
    };
    this.events.on('contractsDeployed', generateABICode);
    this.events.on('blockchainDisabled', generateABICode);
  }

  deploymentService(options) {
    let self = this;
    this.deployManager = new DeployManager({
      web3: options.web3 || self.web3,
      trackContracts: options.trackContracts,
      config: this.config,
      logger: this.logger,
      plugins: this.plugins,
      events: this.events
    });

    this.events.on('file-event', function (fileType, path) {
      // TODO: for now need to deploy on asset chanes as well
      // because the contractsManager config is corrupted after a deploy
      //if (fileType === 'contract' || fileType === 'config') {
      self.config.reloadConfig();
      self.deployManager.deployContracts(function () {
      });
      //}
    });
  }

  fileWatchService(options) {
    this.logger.setStatus("Watching for changes");
    let watch = new Watch({logger: this.logger, events: this.events});
    watch.start();
  }

  webServerService(options) {
    let self = this;
    let webServerConfig = this.config.webServerConfig;
    if (!webServerConfig.enabled) {
      return;
    }

    let host = options.host || webServerConfig.host;
    let port = options.port || webServerConfig.port;

    this.logger.setStatus("Starting Server");
    let server = new Server({
      logger: this.logger,
      host: host,
      port: port
    });

    self.servicesMonitor.addCheck('Webserver', function (cb) {
      let devServer = 'Webserver (http://' + host + ':' + port + ')';
      return cb({name: devServer, status: 'on'});
    });

    server.start(function () {
    });
  }

  ipfsService(options) {
    let self = this;
    self.servicesMonitor.addCheck('IPFS', function (cb) {
      utils.checkIsAvailable('http://localhost:5001', function (available) {
        if (available) {
          //Ideally this method should be in an IPFS API JSONRPC wrapper
          //The URL should also be flexible to accept non-default IPFS url
          self.logger.trace("Checking IPFS version...");
          utils.httpGet('http://localhost:5001/api/v0/version', function (res) {
            let body = '';
            res.on('data', function (d) {
              body += d;
            });
            res.on('end', function () {
              try {
                let parsed = JSON.parse(body);
                if (parsed.Version) {
                  return cb({name: ("IPFS " + parsed.Version), status: 'on'});
                }
                else {
                  return cb({name: "IPFS ", status: 'on'});
                }
              }
              catch (e) {
                return cb({name: "IPFS ", status: 'off'});
              }
            });
            res.on('error', function (err) {
              self.logger.trace("Check IPFS version error: " + err);
              return cb({name: "IPFS ", status: 'off'});
            });
          });
        }
        else {
          return cb({name: "IPFS ", status: 'off'});
        }
      });
    });
  }

  web3Service(options) {
    let self = this;
    this.web3 = options.web3;
    if (this.web3 === undefined) {
      this.web3 = new Web3();
      let web3Endpoint = 'http://' + this.config.blockchainConfig.rpcHost + ':' + this.config.blockchainConfig.rpcPort;
      this.web3.setProvider(new this.web3.providers.HttpProvider(web3Endpoint));
    }

    self.servicesMonitor.addCheck('Ethereum', function (cb) {
      if (self.web3.isConnected()) {
        return cb({
          name: (self.web3.version.node.split("/")[0] + " " + self.web3.version.node.split("/")[1].split("-")[0] + " (Ethereum)"),
          status: 'on'
        });
      } else {
        return cb({name: "No Blockchain node found", status: 'off'});
      }
    });

    self.servicesMonitor.addCheck('Whisper', function (cb) {
      self.web3.version.getWhisper(function (err, version) {
        if (err) {
          return cb({name: 'Whisper', status: 'off'});
        } else if (version >= 5) {
          return cb({name: 'Whisper (version ' + version + ') - unsupported', status: 'warn'});
        } else {
          return cb({name: 'Whisper (version ' + version + ')', status: 'on'});
        }
      });
    });
  }
}

module.exports = Engine;
