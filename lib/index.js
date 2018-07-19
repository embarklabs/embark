let async = require('async');
const constants = require('./constants');

require('colors');

// Override process.chdir so that we have a partial-implementation PWD for Windows
const realChdir = process.chdir;
process.chdir = (...args) => {
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }
  realChdir(...args);
};

let version = require('../package.json').version;

class Embark {

  constructor(options) {
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
    return require('./cmds/blockchain/blockchain.js')(this.config.blockchainConfig, client, env).run();
  }

  simulator(options) {
    this.context = options.context || [constants.contexts.simulator, constants.contexts.blockchain];
    let Simulator = require('./cmds/simulator.js');
    let simulator = new Simulator({
      blockchainConfig: this.config.blockchainConfig,
      logger: this.logger
    });
    simulator.run(options);
  }

  generateTemplate(templateName, destinationFolder, name, url) {
    this.context = [constants.contexts.templateGeneration];
    let TemplateGenerator = require('./cmds/template_generator.js');
    let templateGenerator = new TemplateGenerator(templateName);

    if (url) {
      return templateGenerator.downloadAndGenerate(url, destinationFolder, name);
    }
    templateGenerator.generate(destinationFolder, name);
  }

  run(options) {
    let self = this;
    self.context = options.context || [constants.contexts.run, constants.contexts.build];
    let Dashboard = require('./dashboard/dashboard.js');

    let webServerConfig = {
      enabled: options.runWebserver
    };

    if (options.serverHost) {
      webServerConfig.host = options.serverHost;
    }
    if (options.serverPort) {
      webServerConfig.port = options.serverPort;
    }

    const Engine = require('./core/engine.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: self.context,
      useDashboard: options.useDashboard,
      webServerConfig: webServerConfig
    });
    engine.init();

    if (!options.useDashboard) {
      engine.logger.info('========================'.bold.green);
      engine.logger.info((__('Welcome to Embark') + ' ' + this.version).yellow.bold);
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
          env: engine.env
        });
        dashboard.start(function () {
          engine.logger.info(__('dashboard start'));
          callback();
        });
      },
      function (callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.startService("processManager");
        engine.startService("serviceMonitor");
        engine.startService("libraryManager");
        engine.startService("codeRunner");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("deployment");
        engine.startService("storage");
        engine.startService("codeGenerator");
        engine.startService("namingSystem");

        engine.events.on('check:backOnline:Ethereum', function () {
          engine.logger.info(__('Ethereum node detected') + '..');
          engine.config.reloadConfig();
          engine.events.request('deploy:contracts', function (err) {
            if (err) {
              return;
            }
            engine.logger.info(__('Deployment Done'));
          });
        });

        engine.events.on('outputDone', function () {
          engine.logger.info((__("Looking for documentation? You can find it at") + " ").cyan + "http://embark.status.im/docs/".green.underline + ".".cyan);
          engine.logger.info(__("Ready").underline);
          engine.events.emit("status", __("Ready").green);
        });

        if (options.runWebserver) {
          engine.startService("webServer", {
            host: options.serverHost,
            port: options.serverPort
          });
        }
        engine.startService("fileWatcher");
        callback();
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {
        engine.events.emit('firstDeploymentDone');
      }
    });
  }

  build(options) {
    this.context = options.context || [constants.contexts.build];

    const Engine = require('./core/engine.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
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
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.startService("processManager");
        engine.startService("libraryManager");
        engine.startService("codeRunner");
        engine.startService("web3");
        if (!options.onlyCompile) {
          engine.startService("pipeline");
        }
        engine.startService("deployment", {onlyCompile: options.onlyCompile});
        engine.startService("storage");
        engine.startService("codeGenerator");

        callback();
      },
      function deploy(callback) {
        engine.events.request('deploy:contracts', function (err) {
          callback(err);
        });
      },
      function waitForWriteFinish(callback) {
        if (options.onlyCompile) {
          engine.logger.info("Finished compiling".underline);
          return callback(null, true);
        }
        engine.logger.info("Finished deploying".underline);
        engine.events.on('outputDone', (err) => {
          engine.logger.info(__("finished building").underline);
          callback(err, true);
        });
      }
    ], function (err, canExit) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.debug(err.stack);
      }

      // TODO: this should be moved out and determined somewhere else
      if (canExit || !engine.config.contractsConfig.afterDeploy || !engine.config.contractsConfig.afterDeploy.length) {
        process.exit();
      }
      engine.logger.info(__('Waiting for after deploy to finish...'));
      engine.logger.info(__('You can exit with CTRL+C when after deploy completes'));
    });
  }

  console(options) {
    this.context = options.context || [constants.contexts.run, constants.contexts.console];
    const REPL = require('./dashboard/repl.js');
    const Engine = require('./core/engine.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: this.context
    });
    engine.init();
    async.waterfall([
      function startServices(callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.startService("libraryManager");
        engine.startService("codeRunner");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("deployment", {onlyCompile: false});
        engine.startService("storage");
        engine.startService("codeGenerator");
        engine.startService("fileWatcher");

        callback();
      },
      function deploy(callback) {
        engine.events.request('deploy:contracts', function (err) {
          callback(err);
        });
      },
      function waitForWriteFinish(callback) {
        engine.logger.info("Finished deploying".underline);
        engine.events.once('outputDone', (err) => {
          engine.logger.info(__("finished building").underline);
          callback(err);
        });
      },
      function startREPL(callback) {
        let repl = new REPL({
          env: engine.env,
          plugins: engine.plugins,
          version: engine.version,
          events: engine.events
        });
        repl.start(callback);
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {
        engine.events.emit('firstDeploymentDone');
      }
    });
  }

  graph(options) {
    this.context = options.context || [constants.contexts.graph];
    options.onlyCompile = true;

    const Engine = require('./core/engine.js');
    const engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      context: this.context
    });
    engine.init();

    async.waterfall([
      function (callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.startService("processManager");
        engine.startService("serviceMonitor");
        engine.startService("libraryManager");
        engine.startService("pipeline");
        engine.startService("deployment", {onlyCompile: true});
        engine.startService("web3");
        engine.startService("codeGenerator");

        engine.events.request('deploy:contracts', callback);
      }
    ], (err) => {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {

        const GraphGenerator = require('./cmds/graph.js');
        let graphGen = new GraphGenerator(engine);
        graphGen.generate(options);

        engine.logger.info(__("Done. %s generated", "./diagram.svg").underline);
      }
      process.exit();
    });

  }

  reset() {
    this.context = [constants.contexts.reset];
    let resetCmd = require('./cmds/reset.js');
    resetCmd();
  }

  upload(options) {
    this.context = options.context || [constants.contexts.upload, constants.contexts.build];

    const Engine = require('./core/engine.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
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

    let platform = engine.config.storageConfig.upload.provider;

    async.waterfall([

      function startServices(callback) {

        engine.startService("processManager");
        engine.startService("serviceMonitor");
        engine.startService("libraryManager");
        engine.startService("codeRunner");
        engine.startService("web3");
        engine.startService("pipeline");
        engine.startService("deployment");
        engine.startService("storage");
        engine.startService("codeGenerator");
        callback();
      },
      function listLoadedPlugin(callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }
        callback();
      },
      function deploy(callback) {
        engine.events.on('outputDone', function () {
          engine.events.request("storage:upload", callback);
        });
        engine.events.on('check:backOnline:Ethereum', function () {
          engine.logger.info(__('Ethereum node detected') + '..');
          engine.config.reloadConfig();
          engine.events.request('deploy:contracts', function (err) {
            if (err) {
              return;
            }
            engine.logger.info(__('Deployment Done'));
          });
        });
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.debug(err.stack);
      } else {
        engine.logger.info((__("finished building DApp and deploying to") + " " + platform).underline);
      }

      // needed due to child processes
      process.exit();
    });
  }

  runTests(options) {
    this.context = [constants.contexts.test];
    let RunTests = require('./tests/run_tests.js');
    RunTests.run(options);
  }
}

module.exports = Embark;
