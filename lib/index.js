/*jshint esversion: 6 */
var async = require('async');
//require("./core/debug_util.js")(__filename, async);

var Web3 = require('web3');
var colors = require('colors');

var Engine = require('./core/engine.js');

var Blockchain = require('./cmds/blockchain/blockchain.js');
var Simulator = require('./cmds/simulator.js');
var TemplateGenerator = require('./cmds/template_generator.js');

var Test = require('./core/test.js');
var Logger = require('./core/logger.js');
var Config = require('./core/config.js');
var Events = require('./core/events.js');

var Dashboard = require('./dashboard/dashboard.js');

var IPFS = require('./upload/ipfs.js');
var Swarm = require('./upload/swarm.js');

var Cmd = require('./cmd.js');

var Embark = {

  version: '2.4.2',

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  initConfig: function(env, options) {
    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug'});

    this.config = new Config({env: env, logger: this.logger, events: this.events});
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

  run: function(options) {
    var self = this;
    var env = options.env;

    var engine = new Engine({
      env: options.env,
      embarkConfig: 'embark.json'
    });
    engine.init();

    if (!options.useDashboard) {
      console.log('========================'.bold.green);
      console.log(('Welcome to Embark ' + Embark.version).yellow.bold);
      console.log('========================'.bold.green);
    }

    async.parallel([
      function startDashboard(callback) {
        if (!options.useDashboard) {
          return callback();
        }

        var dashboard = new Dashboard({
          logger: engine.logger,
          plugins: engine.plugins,
          version: engine.version,
          env: engine.env
        });
        dashboard.start(function() {
          engine.events.on('abi-vanila', function(abi) {
            dashboard.console.runCode(abi);
          });

          callback();
        });
      },
      function (callback) {
        var pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        if (options.useDashboard) {
          engine.startService("monitor", {
            serverHost: options.serverHost,
            serverPort: options.serverPort,
            runWebserver: options.runWebserver
          });
        }
        engine.startService("pipeline");
        engine.startService("abi");
        engine.startService("deployment");

        engine.deployManager.deployContracts(function() {
          engine.startService("fileWatcher");
          if (options.runWebserver) {
            engine.startService("webServer", {
              host: options.serverHost,
              port: options.serverPort
            });
          }
          callback();
        });
      }
    ], function(err, result) {
      if (err) {
        engine.logger.error(err.message);
      } else {
        engine.logger.setStatus("Ready".green);
        engine.logger.info("Looking for documentation? you can find it at ".cyan + "http://embark.readthedocs.io/".green.underline);
        engine.logger.info("Ready".underline);
        engine.events.emit('firstDeploymentDone');
      }
    });
  },

  build: function(options) {
    var self = this;

    var engine = new Engine({
      env: options.env,
      embarkConfig: 'embark.json',
      interceptLogs: false
    });
    engine.init();

    async.waterfall([
      function startServices(callback) {
        var pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        engine.startService("pipeline");
        engine.startService("abi");
        engine.startService("deployment");
        callback();
      },
      function deploy(callback) {
        engine.deployManager.deployContracts(function() {
          callback();
        });
      }
    ], function(err, result) {
      if (err) {
        engine.logger.error(err.message);
      } else {
        engine.logger.info("finished building".underline);
      }
      // needed due to child processes
      process.exit();
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

