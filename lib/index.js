/*jshint esversion: 6 */
var async = require('async');
var Web3 = require('web3');
var colors = require('colors');

var Blockchain = require('./cmds/blockchain/blockchain.js');
var Simulator = require('./cmds/simulator.js');
var TemplateGenerator = require('./cmds/template_generator.js');

var DeployManager = require('./contracts/deploy_manager.js');

var Test = require('./core/test.js');
var Logger = require('./core/logger.js');
var Config = require('./core/config.js');
var ServicesMonitor = require('./core/services.js');
var Events = require('./core/events.js');

var Dashboard = require('./dashboard/dashboard.js');

var Pipeline = require('./pipeline/pipeline.js');
var Server = require('./pipeline/server.js');
var Watch = require('./pipeline/watch.js');

var IPFS = require('./upload/ipfs.js');
var Swarm = require('./upload/swarm.js');

var Cmd = require('./cmd.js');

var Embark = {

  version: '2.3.0',

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  initConfig: function(env, options) {
    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug'});

    this.config = new Config({env: env, logger: this.logger});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;

  },

  blockchain: function(env, client) {
    var blockchain = Blockchain(this.config.blockchainConfig, client, env);
    blockchain.run();
  },

  simulator: function(options) {
    var simulator = new Simulator({blockchainConfig: this.config.blockchainConfig});
    simulator.run(options);
  },

  generateTemplate: function(templateName, destinationFolder, name) {
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  },

  redeploy: function(env) {
    var self = this;
    async.waterfall([
      function reloadFiles(callback) {
        self.config.reloadConfig();
        callback();
      },
      self.buildDeployGenerate.bind(self),
      function buildPipeline(abi, callback) {
        self.logger.setStatus("Building Assets");
        var pipeline = new Pipeline({
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles,
          logger: self.logger,
          plugins: self.plugins
        });
        pipeline.build(abi);
        callback();
      }
    ], function(err, result) {
      if (err) {
        self.logger.error(err.message);
      } else {
        self.logger.trace("finished".underline);
      }
    });
  },

  run: function(options) {
    var self = this;
    var env = options.env;
    async.waterfall([
      function welcome(callback) {
        if (!options.useDashboard) {
          console.log('========================'.bold.green);
          console.log(('Welcome to Embark ' + Embark.version).yellow.bold);
          console.log('========================'.bold.green);
        }
        callback();
      },
      function startDashboard(callback) {
        if (!options.useDashboard) {
          return callback();
        }

        Embark.dashboard = new Dashboard({
          logger: Embark.logger,
          plugins: self.plugins,
          version: self.version,
          env: env
        });
        Embark.dashboard.start(callback);
      },
      function displayLoadedPlugins(callback) {
        var pluginList = self.plugins.listPlugins();
        if (pluginList.length > 0) {
          self.logger.info("loaded plugins: " + pluginList.join(", "));
        }
        callback();
      },
      function monitorServices(callback) {
        if (!options.useDashboard) {
          return callback();
        }
        Embark.servicesMonitor = new ServicesMonitor({
          logger: Embark.logger,
          config: Embark.config,
          serverHost: options.serverHost,
          serverPort: options.serverPort,
          runWebserver: options.runWebserver,
          version: Embark.version
        });
        Embark.servicesMonitor.startMonitor();
        callback();
      },
      function (callback) {
        var deployManager = new DeployManager({
          config: Embark.config,
          logger: Embark.logger,
          plugins: self.plugins,
          events: self.events
        });
        deployManager.deployContracts(function(abi) {
          callback(null, abi);
        });
        //if (Embark.dashboard) {
        //  Embark.dashboard.console.runCode(consoleABI);
        //}
      },
      function buildPipeline(abi, callback) {
        self.logger.setStatus("Building Assets");
        var pipeline = new Pipeline({
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles,
          logger: self.logger,
          plugins: self.plugins
        });
        // TODO: do this with event instead
        pipeline.build(abi);
        callback();
      },
      function watchFilesForChanges(callback) {
        self.logger.setStatus("Watching for changes");
        var watch = new Watch({logger: self.logger, events: self.events});
        watch.start();
        self.events.on('file-event', function(fileType, path) {
          if (fileType === 'contract' || fileType === 'config') {
            self.logger.info("received redeploy event");
            //Embark.redeploy();
          }
        });
        self.events.on('rebuildAssets', function(fileType, path) {
          if (fileType === 'asset') {
            self.logger.info("received rebuildAssets event");
            // TODO: can just rebuild pipeline, no need to deploy contracts
            // again
            //Embark.redeploy();
          }
        });
        callback();
      },
      function startAssetServer(callback) {
        if (!options.runWebserver) {
          return callback();
        }
        self.logger.setStatus("Starting Server");
        var server = new Server({
          logger: self.logger,
          host: options.serverHost,
          port: options.serverPort
        });
        server.start(callback);
      }
    ], function(err, result) {
      if (err) {
        self.logger.error(err.message);
      } else {
        self.logger.setStatus("Ready".green);
        self.logger.info("Looking for documentation? you can find it at ".cyan + "http://embark.readthedocs.io/".green.underline);
        self.logger.info("Ready".underline);
      }
    });
  },

  build: function(env) {
    var self = this;
    async.waterfall([
      function deployAndGenerateABI(callback) {
        Embark.deploy(function(abi) {
          callback(null, abi);
        });
      },
      function buildPipeline(abi, callback) {
        self.logger.trace("Building Assets");
        var pipeline = new Pipeline({
          buildDir: self.config.buildDir,
          contractsFiles: self.config.contractsFiles,
          assetFiles: self.config.assetFiles,
          logger: self.logger,
          plugins: self.plugins
        });
        Embark.events.on('abi', function(abi) {
          pipeline.build(abi);
        });
        callback();
      }
    ], function(err, result) {
      if (err) {
        self.logger.error(err.message);
      } else {
        self.logger.trace("finished".underline);
      }
    });
  },

  deploy: function(done) {
    var self = this;
    async.waterfall([
      function buildAndDeploy(callback) {
        Embark.buildAndDeploy(function(err, contractsManager) {
          callback(err, contractsManager);
        });
      },
      function generateABI(contractsManager, callback) {
      }
    ], function(err, result) {
      if (err) {
        self.logger.error(err.message);
      }
      done(result);
    });
  },

  buildDeployGenerate: function(done) {
    var self = this;

    self.logger.setStatus("Deploying...".magenta.underline);
    async.waterfall([
      function generateConsoleABI(contractsManager, callback) {
        // through a listener
        callback(null, contractsManager);
      },
      function generateABI(contractsManager, callback) {
      }
    ], function(err, result) {
      if (err) {
        self.logger.error("error deploying");
        self.logger.error(err.message);
        self.logger.setStatus("Deployment Error".red);
      } else {
        self.logger.setStatus("Ready".green);
      }
      done(null, result);
    });
  },

  initTests: function(options) {
    return new Test(options);
  },

  // TODO: should deploy if it hasn't already
  upload: function(platform) {
    if (platform === 'ipfs') {
      var ipfs = new IPFS({buildDir: 'dist/', plugins: this.plugins, storageConfig: this.config.storageConfig});
      ipfs.deploy();
    } else if (platform === 'swarm') {
      var swarm = new Swarm({buildDir: 'dist/', plugins: this.plugins, storageConfig: this.config.storageConfig});
      swarm.deploy();
    } else {
      console.log(("unknown platform: " + platform).red);
      console.log('try "embark upload ipfs" or "embark upload swarm"'.green);
    }
  }

};

module.exports = Embark;

