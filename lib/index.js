let async = require('async');
const constants = require('./constants');
const _ = require('underscore');
// require("./utils/debug_util.js")(__filename, async);

require('colors');

// Override process.chdir so that we have a partial-implementation PWD for Windows
const realChdir = process.chdir;
process.chdir = (...args) => {
    if (!process.env.PWD) {
        process.env.PWD = process.cwd();
    }
    realChdir(...args);
};

let Engine = require('./core/engine.js');

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
    this.logger = new Logger({logLevel: 'debug', events: this.events});

    this.config = new Config({env: env, logger: this.logger, events: this.events, context: this.context});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }

  blockchain(env, client) {
    this.context = [constants.contexts.blockchain];
    let blockchainConfig = this.config.blockchainConfig;
    let storageConfig = this.config.storageConfig;
    let webServerConfig = this.config.webServerConfig;

    if(blockchainConfig.rpcCorsDomain === 'auto') {
      if(webServerConfig) blockchainConfig.rpcCorsDomain = `http://${webServerConfig.host}:${webServerConfig.port}`;
      if(storageConfig) blockchainConfig.rpcCorsDomain += `${blockchainConfig.rpcCorsDomain.length ? ',' : ''}${storageConfig.protocol}://${storageConfig.host}:${storageConfig.port}`;
    }
    if(blockchainConfig.wsOrigins === 'auto') {
      if(webServerConfig) blockchainConfig.wsOrigins = `http://${webServerConfig.host}:${webServerConfig.port}`;
      if(storageConfig) blockchainConfig.wsOrigins += `${blockchainConfig.wsOrigins.length ? ',' : ''}${storageConfig.protocol}://${storageConfig.host}:${storageConfig.port}`;
    }
    return require('./cmds/blockchain/blockchain.js')(blockchainConfig, client, env).run();
  }

  simulator(options) {
    this.context = options.context || [constants.contexts.simulator, constants.contexts.blockchain];
    let Simulator = require('./cmds/simulator.js');
    let simulator = new Simulator({blockchainConfig: this.config.blockchainConfig, logger: this.logger});
    simulator.run(options);
  }

  generateTemplate(templateName, destinationFolder, name) {
    this.context = [constants.contexts.templateGeneration];
    let TemplateGenerator = require('./cmds/template_generator.js');
    let templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  }

  run(options) {
    let self = this;
    self.context = options.context || [constants.contexts.run, constants.contexts.build];
    let Dashboard = require('./dashboard/dashboard.js');
    let windowSize = require('window-size');

    let engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: self.context
    });
    engine.init();

    if (!options.useDashboard) {
      engine.logger.info('========================'.bold.green);
      engine.logger.info(('Welcome to Embark ' + this.version).yellow.bold);
      engine.logger.info('========================'.bold.green);
    }

    async.parallel([
      function startDashboard(callback) {
        if (!options.useDashboard) {
          return callback();
        }

        let dashboard = new Dashboard({
          events: engine.events,
          logger: engine.logger,
          plugins: engine.plugins,
          version: self.version,
          env: engine.env,
          contractsConfig: engine.config.contractsConfig
        });
        dashboard.start(function () {
          engine.logger.info('dashboard start');
          callback();
        });
      },
      function (callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        engine.startMonitor();
        engine.startService("libraryManager");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("codeGenerator");
        engine.startService("deployment");
        engine.startService(engine.config.storageConfig.provider, {bzz: engine.web3.bzz});

        engine.events.on('check:backOnline:Ethereum', function () {
          engine.logger.info('Ethereum node detected..');
          engine.config.reloadConfig();
          engine.deployManager.deployContracts(function () {
            engine.logger.info('Deployment Done');
          });
        });

        engine.events.on('outputDone', function () {
          engine.logger.info("Looking for documentation? You can find it at ".cyan + "http://embark.readthedocs.io/".green.underline + ".".cyan);
          engine.logger.info("Ready".underline);
          engine.events.emit("status", "Ready".green);
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
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {
        engine.events.emit('firstDeploymentDone');

        let size = windowSize.get();
        if (size.height < 40 || size.width < 118) {
          engine.logger.warn("tip: you can resize the terminal or disable the dashboard with " + "embark run --nodashboard".bold.underline);
        }
      }
    });
  }

  build(options) {
    this.context = options.context || [constants.contexts.build];

    let engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: 'embark.json',
      interceptLogs: false,
      logFile: options.logFile,
      logLevel: options.logLevel,
      events: options.events,
      logger: options.logger,
      config: options.config,
      plugins: options.plugins,
      context: this.context
    });
    engine.init();

    async.waterfall([
      function startServices(callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        engine.startService("libraryManager");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("codeGenerator");
        engine.startService("deployment");
        engine.startService("ipfs");
        engine.startService("swarm", {bzz: engine.web3.bzz});
        callback();
      },
      function deploy(callback) {
        engine.deployManager.deployContracts(function (err) {
          callback(err);
        });
      }
    ], function (err, _result) {
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
    this.context = options.context || [constants.contexts.test];
    let Test = require('./tests/test.js');
    options.context = this.context;
    return new Test(options);
  }

  graph(options) {
    this.context = options.context || [constants.contexts.graph];
    options.onlyCompile = true;
    
    let engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      context: this.context
    });
    engine.init();


    async.parallel([
     
      function (callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }

        engine.startMonitor();
        engine.startService("libraryManager");
        engine.startService("pipeline");
        engine.startService("codeGenerator");
        engine.startService("deployment", {onlyCompile: true});

        engine.deployManager.deployContracts(function (err) {
          callback(err);
        });
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {

        const GraphGenerator = require('./cmds/graph.js');
        let graphGen = new GraphGenerator(engine);
        graphGen.generate();

        engine.logger.info("Done".underline);
        process.exit();
      }
    });

  }

  reset() {
    this.context = [constants.contexts.reset];
    let resetCmd = require('./cmds/reset.js');
    resetCmd();
  }

  upload(platform, options) {
    
    this.context = options.context || [constants.contexts.upload, constants.contexts.build];

    let engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: 'embark.json',
      interceptLogs: false,
      logFile: options.logFile,
      logLevel: options.logLevel,
      events: options.events,
      logger: options.logger,
      config: options.config,
      plugins: options.plugins
    });
    engine.init();

    let cmdPlugin;
    async.waterfall([
      
      function startServices(callback) {
        
        engine.startService("libraryManager");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("codeGenerator");
        engine.startService("deployment");
        engine.startService(platform.toLowerCase(), {bzz: engine.web3.bzz});
        engine.startMonitor();
        callback();
      },
      function checkStorageService(callback){
        let checkFn; 
        _.find(engine.servicesMonitor.checkList, (value, key) => {
          if(key.toLowerCase() === platform.toLowerCase()){
            checkFn = value;
            return true;
          }
        });
        if (!checkFn || typeof checkFn.fn !== 'function') {
          return callback();
        }
        checkFn.fn(function (serviceCheckResult) {
          if (!serviceCheckResult.status || serviceCheckResult.status === 'off') {
            return callback({message: `Cannot upload: ${platform} node is not running on http://${engine.config.storageConfig.host}:${engine.config.storageConfig.port}.`});
          }
          callback();
        });
      },
      function setupStoragePlugin(callback){
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info("loaded plugins: " + pluginList.join(", "));
        }
        
        // check use has input existing storage plugin
        let cmdPlugins = engine.plugins.getPluginsFor('uploadCmds');
        
        if (cmdPlugins.length > 0) {
          cmdPlugin = cmdPlugins.find((pluginCmd) => {
            return pluginCmd.uploadCmds.some(uploadCmd => {
              return uploadCmd.cmd === platform;
            });
          });
        }
        if (!cmdPlugin) {
          engine.logger.info('try "embark upload ipfs" or "embark upload swarm"'.green);
          return callback({message: 'unknown platform: ' + platform});
        }
        callback();
      },
      function deploy(callback) {
        // 2. upload to storage (outputDone event triggered after webpack finished)
        engine.events.on('outputDone', function () {
          cmdPlugin.uploadCmds[0].cb()
          .then((success) => {
            callback(null, success);
          })
          .catch(callback);
        });
        // 1. build the contracts and dapp webpack
        engine.deployManager.deployContracts(function (err) {
          engine.logger.info("finished deploying".underline);
          if(err){
              callback(err);
          }
        });
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.debug(err.stack);
      } else {
        engine.logger.info(`finished building DApp and deploying to ${platform}`.underline);
      }

      // needed due to child processes
      process.exit();
    });
  }

  runTests(file) {
    this.context = [constants.contexts.test];
    let RunTests = require('./tests/run_tests.js');
    RunTests.run(file);
  }

}

// temporary until next refactor
Embark.initTests = function(options) {
  let Test = require('./tests/test.js');
  options.context = [constants.contexts.test];
  return new Test(options);
};

module.exports = Embark;
