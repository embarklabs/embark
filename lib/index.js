/*jshint esversion: 6 */
let async = require('async');
// require("./utils/debug_util.js")(__filename, async);

let colors = require('colors');

let IPFS = require('./upload/ipfs.js');
let Swarm = require('./upload/swarm.js');

let EventEmitter = require('events').EventEmitter;
let Config = require('./core/config');
/**
 * Initialize a new `Embark` instance.
 *
 * @return {Embark}
 * @api public
 */

class Embark {
  constructor(options) {
    this.version = require('../package.json').version;

    this.env = options.environment || options.env || "development";

    this.config = new Config({env: this.env, logger: this.logger, events: this.events});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;

    this.blockchain = function (env, client) {
      return require('./cmds/blockchain/blockchain.js')(Embark.prototype.config.blockchainConfig, client, env).run();
    };

    this.simulator = function (options) {
      let Simulator = require('./cmds/simulator.js');
      let simulator = new Simulator({blockchainConfig: Embark.prototype.config.blockchainConfig});
      simulator.run(options);
    };

    this.generateTemplate = function (templateName, destinationFolder, name) {
      let TemplateGenerator = require('./cmds/template_generator.js');
      let templateGenerator = new TemplateGenerator(templateName);
      templateGenerator.generate(destinationFolder, name);
    };

    this.run = function (options) {
      let Dashboard = require('./dashboard/dashboard.js');
      let Engine = require('./core/engine');
      let engine = new Engine({
        env: options.env,
        embarkConfig: options.embarkConfig || 'embark.json'
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

          let dashboard = new Dashboard({
            logger: engine.logger,
            plugins: engine.plugins,
            version: engine.version,
            env: engine.env
          });
          dashboard.start(function () {
            Embark.on('abi-vanila', function (abi) {
              dashboard.console.runCode(abi);
            });

            engine.logger.info('dashboard start');
            Embark.on('servicesState', function (servicesState) {
              dashboard.monitor.availableServices(servicesState);
            });

            callback();
          });
        },
        function (callback) {
          let pluginList = engine.plugins.listPlugins();
          if (pluginList.length > 0) {
            engine.logger.info("loaded plugins: " + pluginList.join(", "));
          }

          engine.startMonitor();
          engine.startService("web3");
          engine.startService("pipeline");
          engine.startService("abi");
          engine.startService("deployment");
          engine.startService("ipfs");

          Embark.on('check:backOnline:Ethereum', function () {
            engine.logger.info('Ethereum node detected..');
            engine.config.reloadConfig();
            engine.deployManager.deployContracts(function () {
              engine.logger.info('Deployment Done');
            });
          });

          engine.deployManager.deployContracts(function () {
            engine.startService("fileWatcher");
            if (options.runWebserver) {
              engine.startService("webServer", {
                host: options.serverHost,
                port: options.serverPort
              });
            }
            callback(err);
          });
        }
      ], function (err, result) {
        if (err) {
          engine.logger.error(err.message);
          engine.logger.info(err.stack);
        } else {
          engine.logger.setStatus("Ready".green);
          engine.logger.info("Looking for documentation? you can find it at ".cyan + "http://embark.readthedocs.io/".green.underline);
          engine.logger.info("Ready".underline);
          engine.events.emit('firstDeploymentDone');
        }
      });
    };

    this.build = function (options) {
      let Engine = require('./core/engine');

      let engine = new Engine({
        env: options.env,
        embarkConfig: 'embark.json',
        interceptLogs: false
      });
      engine.init();

      async.waterfall([
        function startServices(callback) {
          let pluginList = engine.plugins.listPlugins();
          if (pluginList.length > 0) {
            engine.logger.info("loaded plugins: " + pluginList.join(", "));
          }

          engine.startService("web3");
          engine.startService("pipeline");
          engine.startService("abi");
          engine.startService("deployment");
          callback();
        },
        function deploy(callback) {
          engine.deployManager.deployContracts(function () {
            callback(err);
          });
        }
      ], function (err, result) {
        if (err) {
          engine.logger.error(err.message);
          engine.logger.debug(err.stack);
        } else {
          engine.logger.info("finished building".underline);
        }
        // needed due to child processes
        process.exit();
      });
    }

    this.initTests = function () {
      let Test = require('./core/test.js');
      return new Test(options);
    }

// TODO: should deploy if it hasn't already
    this.upload = function (platform) {
      if (platform === 'ipfs') {
        let ipfs = new IPFS({
          buildDir: 'dist/',
          plugins: Embark.prototype.plugins,
          storageConfig: Embark.prototype.config.storageConfig
        });
        ipfs.deploy();
      } else if (platform === 'swarm') {
        let swarm = new Swarm({
          buildDir: 'dist/',
          plugins: Embark.prototype.plugins,
          storageConfig: Embark.prototype.config.storageConfig
        });
        swarm.deploy();
      } else {
        console.log(("unknown platform: " + platform).red);
        console.log('try "embark upload ipfs" or "embark upload swarm"'.green);
      }
    };

    if (!(this instanceof Embark)) {
      return new Embark();
    }
    return this;
  }
}

Embark.prototype = Object.create(EventEmitter.prototype);

module.exports = Embark;
