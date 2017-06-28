/*jshint esversion: 6 */
let async = require('async');
// require("./utils/debug_util.js")(__filename, async);

let colors = require('colors');

let Engine = require('./core/engine.js');

let IPFS = require('./upload/ipfs.js');
let Swarm = require('./upload/swarm.js');

let version = require('../package.json').version;

class Embark {

  constructor (options) {
    this.version = version;
    this.options = options || {};
  }

  initConfig(env, options) {
    let Events = require('./core/events.js');
    let Logger = require('./core/logger.js');
    let Config = require('./core/config.js');

    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug'});

    this.config = new Config({env: env, logger: this.logger, events: this.events});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }

  blockchain(env, client) {
    return require('./cmds/blockchain/blockchain.js')(this.config.blockchainConfig, client, env).run();
  }

  simulator(options) {
    let Simulator = require('./cmds/simulator.js');
    let simulator = new Simulator({blockchainConfig: this.config.blockchainConfig});
    simulator.run(options);
  }

  generateTemplate(templateName, destinationFolder, name) {
    let TemplateGenerator = require('./cmds/template_generator.js');
    let templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  }

  run(options) {
    let self = this;
    let Dashboard = require('./dashboard/dashboard.js');

    let env = options.env;

    let engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json'
    });
    engine.init();

    if (!options.useDashboard) {
      console.log('========================'.bold.green);
      console.log(('Welcome to Embark ' + this.version).yellow.bold);
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
          version: self.version,
          env: engine.env
        });
        dashboard.start(function () {
          engine.events.on('abi-vanila', function (abi) {
            dashboard.console.runCode(abi);
          });

          engine.logger.info('dashboard start');
          engine.events.on('servicesState', function (servicesState) {
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

        engine.events.on('check:backOnline:Ethereum', function () {
          engine.logger.info('Ethereum node detected..');
          engine.config.reloadConfig();
          engine.deployManager.deployContracts(function () {
            engine.logger.info('Deployment Done');
          });
        });

        engine.deployManager.deployContracts(function (err) {
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
  }

  build(options) {

    let engine = new Engine({
      env: options.env,
      version: this.version,
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
        engine.deployManager.deployContracts(function (err) {
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

  initTests(options) {
    let Test = require('./core/test.js');
    return new Test(options);
  }

  // TODO: should deploy if it hasn't already
  upload(platform) {
    if (platform === 'ipfs') {
      let ipfs = new IPFS({buildDir: 'dist/', plugins: this.plugins, storageConfig: this.config.storageConfig});
      ipfs.deploy();
    } else if (platform === 'swarm') {
      let swarm = new Swarm({buildDir: 'dist/', plugins: this.plugins, storageConfig: this.config.storageConfig});
      swarm.deploy();
    } else {
      console.log(("unknown platform: " + platform).red);
      console.log('try "embark upload ipfs" or "embark upload swarm"'.green);
    }
  }

}

// temporary until next refactor
Embark.initTests = function(options) {
  let Test = require('./core/test.js');
  return new Test(options);
};

module.exports = Embark;
