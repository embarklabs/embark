/*jshint esversion: 6 */
var async = require('async');
//require("./utils/debug_util.js")(__filename, async);

var colors = require('colors');

var Engine = require('./core/engine.js');

var Test = require('./core/test.js');

var IPFS = require('./upload/ipfs.js');
var Swarm = require('./upload/swarm.js');

var version = require('../package.json').version;

var Embark = function () {
  function initConfig (env, options) {
    var Events = require('./core/events.js');
    var Logger = require('./core/logger.js');
    var Config = require('./core/config.js');

    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug'});

    this.config = new Config({env: env, logger: this.logger, events: this.events});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }

  function blockchain (env, client) {
    return require('./cmds/blockchain/blockchain.js')(this.config.blockchainConfig, client, env).run();
  }

  function simulator (options) {
    var Simulator = require('./cmds/simulator.js');
    var simulator = new Simulator({blockchainConfig: this.config.blockchainConfig});
    simulator.run(options);
  }

  function generateTemplate (templateName, destinationFolder, name) {
    var TemplateGenerator = require('./cmds/template_generator.js');
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  }

  function run (options) {
    var Dashboard = require('./dashboard/dashboard.js');

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

          engine.logger.info('dashboard start');
          engine.events.on('servicesState', function(servicesState) {
            dashboard.monitor.availableServices(servicesState);
          });

          callback();
        });
      },
      function (callback) {
        var pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        engine.startMonitor();
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("abi");
        engine.startService("deployment");
        engine.startService("ipfs");

        engine.events.on('check:backOnline:Ethereum', function() {
          engine.logger.info('Ethereum node detected..');
          engine.config.reloadConfig();
          engine.deployManager.deployContracts(function() {
            engine.logger.info('Deployment Done');
          });
        });

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
  }

  function build (options) {

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
  }

  function initTests (options) {
    return new Test(options);
  }

  // TODO: should deploy if it hasn't already
  function upload (platform) {
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

  return {
    version: version,
    initConfig: initConfig,
    blockchain: blockchain,
    simulator: simulator,
    generateTemplate: generateTemplate,
    run: run,
    build: build,
    initTests: initTests,
    upload: upload
  };

}();

Embark.initTests = function() {
  console.error("=============================".green);
  console.error("deprecated: Starting with Embark 2.5.0 the Embark object needs to be initialized".red);
  console.log("replace:");
  console.log("var Embark = require('embark');");
  console.log("with:");
  console.log("var Embark = require('embark')();");
  console.error("=============================".green);
  var embark = Embark();
  return embark.initTests();
};

module.exports = Embark;

