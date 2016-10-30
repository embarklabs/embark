/*jshint esversion: 6 */
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');
var colors = require('colors');
var chokidar = require('chokidar');

var Cmd = require('./cmd.js');
var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');
var TemplateGenerator = require('./template_generator.js');
var Blockchain = require('./blockchain.js');
var Server = require('./server.js');
var Watch = require('./watch.js');
var Pipeline = require('./pipeline.js');
var Test = require('./test.js');
var Logger = require('./logger.js');
var Config = require('./config.js');
var Monitor = require('./monitor.js');
var ServicesMonitor = require('./services.js');
var Console = require('./console.js');
var IPFS = require('./ipfs.js');

var Embark = {

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  generateTemplate: function(templateName, destinationFolder, name) {
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  },

  initConfig: function(env, options) {
    this.config = new Config({env: env});
    this.config.loadConfigFiles(options);
    this.logger = new Logger({logLevel: 'debug'});

    //this.contractsManager = new ContractsManager(configDir, files, env);
    //this.contractsManager.init();
    //return this.contractsManager;
  },

  redeploy: function(env) {
    var self = this;
    async.waterfall([
      function reloadFiles(callback) {
        self.config.reloadConfig();
        callback();
      },
      self.buildDeployGenerate.bind(self)
    ], function(err, result) {
      self.logger.trace("finished".underline);
    });
  },

  run: function(options) {
    var self = this;
    var env = options.env;
    async.waterfall([
      function startConsole(callback) {
        Embark.console = new Console();
        callback();
      },
      function startMonitor(callback) {
        Embark.monitor = new Monitor({env: env, console: Embark.console});
        Embark.monitor.setStatus("Starting");
        self.logger.logFunction = Embark.monitor.logEntry;
        self.logger.contractsState = Embark.monitor.setContracts;
        self.logger.availableServices = Embark.monitor.availableServices;
        // TODO: do this after monitor is rendered
        callback();
      },
      function monitorServices(callback) {
        Embark.servicesMonitor = new ServicesMonitor({
          logger: Embark.logger,
          config: Embark.config,
          serverHost: options.serverHost,
          serverPort: options.serverPort
        });
        Embark.servicesMonitor.startMonitor();
        callback();
      },
      self.buildDeployGenerate.bind(self),
      function startAssetServer(callback) {
        Embark.monitor.setStatus("Starting Server");
        var server = new Server({
          logger: self.logger,
          host: options.serverHost,
          port: options.serverPort
        });
        server.start(callback);
      },
      function watchFilesForChanges(callback) {
        Embark.monitor.setStatus("Watching for changes");
        var watch = new Watch({logger: self.logger});
        watch.start();
        watch.on('redeploy', function() {
          self.logger.info("received redeploy event");
          Embark.redeploy();
        });
        watch.on('rebuildAssets', function() {
          self.logger.info("received rebuildAssets event");
          // TODO: make this more efficient
          Embark.redeploy();
        });
        callback();
      }
    ], function(err, result) {
      Embark.monitor.setStatus("Ready".green);
      self.logger.trace("finished".underline);
    });
  },

  build: function(env) {
    async.waterfall([
      function deployAndGenerateABI(callback) {
        Embark.deploy(function(abi) {
          callback(null, abi);
        });
      },
      function buildPipeline(abi, callback) {
        var pipeline = new Pipeline({});
        pipeline.build(abi);
        callback();
      }
    ], function(err, result) {
      self.logger.trace("finished".underline);
    });
  },

  blockchain: function(env, client) {
    var blockchain = Blockchain(this.config.blockchainConfig, client);
    blockchain.run({env: env});
  },

  buildAndDeploy: function(done) {
    var self = this;
    async.waterfall([
      function buildContracts(callback) {
        var contractsManager = new ContractsManager({
          contractFiles:  self.config.contractsFiles,
          contractsConfig: self.config.contractsConfig,
          logger: Embark.logger
        });
        contractsManager.build(callback);
      },
      function deployContracts(contractsManager, callback) {

        //TODO: figure out where to put this since the web3 can be passed along if needed
        // perhaps it should go into the deploy object itself
        // TODO: should come from the config object
        var web3 = new Web3();
        var web3Endpoint = 'http://' + self.config.blockchainConfig.rpcHost + ':' + self.config.blockchainConfig.rpcPort;
        web3.setProvider(new web3.providers.HttpProvider(web3Endpoint));

        if (!web3.isConnected()) {
          console.log(("Couldn't connect to " + web3Endpoint.underline + " are you sure it's on?").red);
          console.log("make sure you have an ethereum node or simulator running. e.g 'embark blockchain'".magenta);
          exit();
        }

        web3.eth.getAccounts(function(err, accounts) {
          web3.eth.defaultAccount = accounts[0];

          var deploy = new Deploy({
            web3: web3,
            contractsManager: contractsManager,
            logger: Embark.logger,
            chainConfig: self.config.chainTracker,
            env: self.config.env
          });
          deploy.deployAll(function() {
            callback(null, contractsManager);
          });
        });

      }
    ], function(err, result) {
      if (err) {
        done(err, null);
      } else {
        done(null, result);
      }
    });
  },

  deploy: function(done) {
    var self = this;
    async.waterfall([
      function buildAndDeploy(callback) {
        Embark.buildAndDeploy(function(contractsManager) {
          callback(null, contractsManager);
        });
      },
      function generateABI(contractsManager, callback) {
        var abiGenerator = new ABIGenerator(self.config.blockchainConfig, contractsManager);
        callback(null, abiGenerator.generateABI({useEmbarkJS: true}));
      }
    ], function(err, result) {
      done(result);
    });
  },


  buildDeployGenerate: function(done) {
    var self = this;

    Embark.monitor.setStatus("Deploying...".magenta.underline);
    async.waterfall([
      function deployAndBuildContractsManager(callback) {
        Embark.buildAndDeploy(function(err, contractsManager) {
          if (err) {
            callback(err);
          } else {
            callback(null, contractsManager);
          }
        });
      },
      function generateConsoleABI(contractsManager, callback) {
        var abiGenerator = new ABIGenerator(self.config.blockchainConfig, contractsManager);
        var consoleABI = abiGenerator.generateABI({useEmbarkJS: false});
        Embark.console.runCode(consoleABI);
        callback(null, contractsManager);
      },
      function generateABI(contractsManager, callback) {
        var abiGenerator = new ABIGenerator(self.config.blockchainConfig, contractsManager);
        callback(null, abiGenerator.generateABI({useEmbarkJS: true}));
      },
      function buildPipeline(abi, callback) {
        Embark.monitor.setStatus("Building Assets");
        var pipeline = new Pipeline({
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles,
          logger: self.logger
        });
        pipeline.build(abi);
        callback();
      }
    ], function(err, result) {
      if (err) {
        self.logger.error("error deploying");
        self.logger.error(err.message);
        Embark.monitor.setStatus("Deployment Error".red);
      } else {
        Embark.monitor.setStatus("Ready".green);
      }
      done(result);
    });
  },

  initTests: function(options) {
    return new Test(options);
  },

  // TODO: should deploy if it hasn't already
  ipfs: function() {
    var ipfs = new IPFS({buildDir: 'dist/'});
    ipfs.deploy();
  }

};

module.exports = Embark;

