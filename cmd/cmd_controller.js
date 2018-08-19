let async = require('async');
const constants = require('../lib/constants');

require('colors');

let version = require('../package.json').version;

class EmbarkController {

  constructor(options) {
    this.version = version;
    this.options = options || {};
  }

  initConfig(env, options) {
    let Events = require('../lib/core/events.js');
    let Logger = require('../lib/core/logger.js');
    let Config = require('../lib/core/config.js');

    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug', events: this.events});

    this.config = new Config({env: env, logger: this.logger, events: this.events, context: this.context});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }

  blockchain(env, client) {
    this.context = [constants.contexts.blockchain];
    return require('../lib/modules/blockchain_process/blockchain.js')(this.config.blockchainConfig, client, env).run();
  }

  simulator(options) {
    this.context = options.context || [constants.contexts.simulator, constants.contexts.blockchain];
    let Simulator = require('../lib/modules/blockchain_process/simulator.js');
    let simulator = new Simulator({
      blockchainConfig: this.config.blockchainConfig,
      logger: this.logger
    });
    simulator.run(options);
  }

  generateTemplate(templateName, destinationFolder, name, url) {
    this.context = [constants.contexts.templateGeneration];
    let TemplateGenerator = require('../lib/utils/template_generator.js');
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
    let REPL = require('./dashboard/repl.js');

    let webServerConfig = {
      enabled: options.runWebserver
    };

    if (options.serverHost) {
      webServerConfig.host = options.serverHost;
    }
    if (options.serverPort) {
      webServerConfig.port = options.serverPort;
    }

    const Engine = require('../lib/core/engine.js');
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
      webServerConfig: webServerConfig,
      webpackConfigName: options.webpackConfigName
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
          new REPL({
            env: engine.env,
            plugins: engine.plugins,
            version: engine.version,
            events: engine.events,
            logger: engine.logger,
            ipc: engine.ipc
          }).startConsole();
          return callback();
        }

        let dashboard = new Dashboard({
          events: engine.events,
          logger: engine.logger,
          plugins: engine.plugins,
          version: self.version,
          env: engine.env,
          ipc: engine.ipc
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

    const Engine = require('../lib/core/engine.js');
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
      context: this.context,
      webpackConfigName: options.webpackConfigName
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
    const Engine = require('../lib/core/engine.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: this.context,
      ipcRole: 'client',
      webpackConfigName: options.webpackConfigName
    });
    engine.init();
    async.waterfall([
      function startServices(callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.ipc.connect((err) => {
          if (err) {
            engine.startService("processManager");
            engine.startService("serviceMonitor");
            engine.startService("libraryManager");
            engine.startService("codeRunner");
            engine.startService("web3");
            engine.startService("pipeline");
            engine.startService("deployment");
            engine.startService("storage");
            engine.startService("codeGenerator");
            engine.startService("webServer");

            return callback();
          }

          engine.startService("codeRunner");
          callback();
        });
      },
      function web3IPC(callback) {
        // Do specific work in case we are connected to a socket:
        //  - Setup Web3
        //  - Apply history
        if(!engine.ipc.connected || engine.ipc.isServer()) {
          return callback();
        }
        const Web3 = require('web3');
        let web3 = new Web3();
        engine.ipc.request("runcode:getCommands", null, (_, {web3Config, commands}) => {
          web3.setProvider(web3Config.provider.host);
          web3.eth.defaultAccount = web3Config.defaultAccount;
          engine.events.emit("runcode:register", "web3", web3);
          async.each(commands, ({varName, code}, next) => {
            if (varName) {
              engine.events.emit("runcode:register", varName, code);
            } else {
              engine.events.request("runcode:eval", code);
            }
            next();
          }, callback);
        });
      },
      function deploy(callback) {
        // Skip if we are connected to a websocket, the server will do it
        if(engine.ipc.connected && engine.ipc.isClient()) {
          return callback();
        }
        engine.events.request('deploy:contracts', function (err) {
          callback(err);
        });
      },
      function waitForWriteFinish(callback) {
        // Skip if we are connected to a websocket, the server will do it
        if(engine.ipc.connected && engine.ipc.isClient()) {
          return callback();
        }
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
          events: engine.events,
          logger: engine.logger,
          ipc: engine.ipc
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

    const Engine = require('../lib/core/engine.js');
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
        engine.startService("graph");

        engine.events.request('deploy:contracts', callback);
      }
    ], (err) => {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {

        engine.events.request("graph:create", options, () => {
          engine.logger.info(__("Done. %s generated", "./diagram.svg").underline);
        });
      }
      process.exit();
    });

  }

  reset() {
    var fs = require('../lib/core/fs.js');
    fs.removeSync('./chains.json');
    fs.removeSync('.embark/');
    fs.removeSync('node_modules/.cache');
    fs.removeSync('dist/');
    console.log(__("reset done!").green);
  }

  ejectWebpack() {
    var fs = require('../lib/core/fs.js');
    var dappConfig = fs.dappPath('webpack.config.js');
    var embarkConfig = fs.embarkPath('lib/pipeline', 'webpack.config.js');
    if (fs.existsSync(dappConfig)) {
      console.error(`${dappConfig} ${__('already exists')}`.bold.red);
      console.error(__('not overwritten, rename or re/move the file and re-run this command').yellow);
      process.exit(1);
    } else {
      fs.copySync(embarkConfig, dappConfig);
      console.log(`${embarkConfig}`.green);
      console.log(__('copied to').dim.green);
      console.log(`${dappConfig}`.green);
    }
  }

  upload(options) {
    this.context = options.context || [constants.contexts.upload, constants.contexts.build];

    const Engine = require('../lib/core/engine.js');
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
        if(options.ensDomain) {
          engine.startService("namingSystem");
        }
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
      },
      function associateToENS(hash, callback) {
        if(!options.ensDomain) {
          return callback(null, hash);
        }
        engine.events.request("storage:ens:associate",
          {name: options.ensDomain, storageHash: hash}, (err) => {
            if (err) {
              return callback(err);
            }
            engine.logger.info(__('ENS association completed for {{hash}} at {{domain}}', {hash, domain: options.ensDomain}));
            callback();
          });
      }
    ], function (err) {
      if (err) {
        if (err.message) {
          engine.logger.error(err.message);
          return engine.logger.debug(err.stack);
        }
        engine.locale.error(err);
      } else {
        engine.logger.info((__("finished building DApp and deploying to") + " " + platform).underline);
      }

      // needed due to child processes
      process.exit();
    });
  }

  runTests(options) {
    this.context = [constants.contexts.test];
    let RunTests = require('../lib/tests/run_tests.js');
    RunTests.run(options);
  }
}

module.exports = EmbarkController;
