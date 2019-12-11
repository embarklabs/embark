import { Config, Events, fs, TemplateGenerator } from 'embark-core';
import { Engine } from 'embark-engine';
import { __ } from 'embark-i18n';
import { dappPath, embarkPath, joinPath, setUpEnv } from 'embark-utils';
import { Logger, LogLevels } from 'embark-logger';
let async = require('async');
const constants = require('embark-core/constants');
const { reset: embarkReset, paths: defaultResetPaths } = require('embark-reset');
const cloneDeep = require('clone-deep');
import { readJsonSync } from 'fs-extra';
import { join } from 'path';

setUpEnv(joinPath(__dirname, '../../'));

require('colors');

const pkg = readJsonSync(join(__dirname, '../../package.json'));

class EmbarkController {

  constructor(options) {
    this.version = pkg.version;
    this.options = options || {};

    // set a default context. should be overwritten by an action
    // method before being used
    this.context = {};
  }

  initConfig(env, options) {
    this.events = new Events();
    this.logger = new Logger({ logLevel: LogLevels.debug, events: this.events, context: this.context });
    this.config = new Config({ env: env, logger: this.logger, events: this.events, context: this.context, version: this.version });
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }

  blockchain(options) {
    this.context = options.context || [constants.contexts.blockchain];
    const webServerConfig = {};

    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: this.context,
      useDashboard: options.useDashboard,
      webServerConfig: webServerConfig,
      webpackConfigName: options.webpackConfigName,
      singleUseAuthToken: options.singleUseAuthToken,
      ipcRole: 'server',
      package: pkg
    });

    engine.init({}, () => {
      engine.registerModuleGroup("coreComponents");
      engine.registerModuleGroup("blockchainStackComponents");
      engine.registerModuleGroup("blockchain");

      engine.startEngine(async () => {
        try {
          const alreadyStarted = await engine.events.request2("blockchain:node:start", Object.assign(engine.config.blockchainConfig, { isStandalone: true }));
          if (alreadyStarted) {
            engine.logger.warn(__('Blockchain process already started. No need to run `embark blockchain`'));
            process.exit(0);
          }
        } catch (e) {
          engine.logger.error(e);
          process.exit(1);
        }
      });
    });
  }

  simulator(options) {
    this.context = options.context || [constants.contexts.simulator, constants.contexts.blockchain];
    const Simulator = require('./simulator');
    let simulator = new Simulator({
      blockchainConfig: this.config.blockchainConfig,
      logger: this.logger
    });
    simulator.run(options);
  }

  generateTemplate(templateName, destinationFolder, name, url) {
    this.context = [constants.contexts.templateGeneration];
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

    const webServerConfig = {};

    if (options.runWebserver !== null && options.runWebserver !== undefined) {
      webServerConfig.enabled = options.runWebserver;
    }

    if (options.serverHost !== null && options.serverHost !== undefined) {
      webServerConfig.host = options.serverHost;
    }

    if (options.serverPort !== null && options.serverPort !== undefined) {
      webServerConfig.port = options.serverPort;
    }

    if (options.openBrowser !== null && options.openBrowser !== undefined) {
      webServerConfig.openBrowser = options.openBrowser;
    }

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
      webpackConfigName: options.webpackConfigName,
      singleUseAuthToken: options.singleUseAuthToken,
      ipcRole: 'server',
      package: pkg
    });

    async.waterfall([
      function initEngine(callback) {
        engine.init({}, () => {
          if (!options.useDashboard) {
            engine.logger.info('========================'.bold.green);
            engine.logger.info((__('Welcome to Embark') + ' ' + engine.version).yellow.bold);
            engine.logger.info('========================'.bold.green);
          }
          callback();
        });
      },
      function (callback) {

        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");
        engine.registerModuleGroup("consoleComponents");

        // TODO: replace with individual plugins
        engine.registerModuleGroup("namesystem");
        engine.registerModuleGroup("communication");
        engine.registerModuleGroup("blockchain");
        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModuleGroup("pipeline");
        engine.registerModuleGroup("webserver");
        engine.registerModuleGroup("filewatcher");
        engine.registerModuleGroup("storage");
        engine.registerModuleGroup("cockpit");
        engine.registerModulePackage('embark-deploy-tracker', { plugins: engine.plugins });
        engine.registerModulePackage("embark-debugger");

        // load custom plugins
        engine.loadDappPlugins();
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        const plugin = engine.plugins.createPlugin('cmdcontrollerplugin', {});
        plugin.registerActionForEvent("embark:engine:started", async (_params, cb) => {
          try {
            await engine.events.request2("blockchain:node:start", engine.config.blockchainConfig);
            await Promise.all([
              engine.events.request2("storage:node:start", engine.config.storageConfig),
              engine.events.request2("communication:node:start", engine.config.communicationConfig),
              engine.events.request2("namesystem:node:start", engine.config.namesystemConfig)
            ]);
          } catch (e) {
            return cb(e);
          }
          cb();
        });

        engine.events.on('check:backOnline:Ethereum', function () {
          engine.logger.info(__('Ethereum node detected') + '..');
          // TODO: deploy contracts, etc...
        });

        engine.events.on('outputDone', function () {
          engine.logger.info((__("Looking for documentation? You can find it at") + " ").cyan + "http://embark.status.im/docs/".green.underline + ".".cyan);
          engine.logger.info(__("Ready").underline);
          engine.events.emit("status", __("Ready").green);
        });

        engine.startEngine(async (err) => {
          if (err) {
            return callback(err);
          }
          callback();

          engine.events.request("webserver:start");

          try {
            await compileAndDeploySmartContracts(engine);
            await setupCargoAndWatcher(engine);
          } catch (e) {
            engine.logger.error(__('Error building and deploying'), e);
          }
        });
      },
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
          ipc: engine.ipc
        });
        dashboard.start(function () {
          engine.logger.info(__('dashboard start'));
          callback();
        });
      }
    ], function (err, _result) {
      if (err) {
        if (err.message && err.stack) {
          engine.logger.error(err.message);
          engine.logger.info(err.stack);
        } else {
          engine.logger.error(err);
        }
      } else {
        // engine.events.emit('firstDeploymentDone');
      }
    });
  }

  build(options) {
    this.context = options.context || [constants.contexts.build];

    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      interceptLogs: false,
      logFile: options.logFile,
      logLevel: options.logLevel,
      logger: options.logger,
      config: options.config,
      context: this.context,
      webpackConfigName: options.webpackConfigName,
      package: pkg
    });


    async.waterfall([
      callback => {
        engine.init({}, callback);
      },
      callback => {
        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");

        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModuleGroup("pipeline");
        engine.registerModuleGroup("communication");
        engine.registerModuleGroup("namesystem");
        engine.registerModulePackage('embark-deploy-tracker', { plugins: engine.plugins });

        engine.registerModuleGroup("blockchain");

        if (!options.onlyCompile) {
          engine.registerModuleGroup("storage");
        }

        // load custom plugins
        engine.loadDappPlugins();
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.events.on('deployment:deployContracts:afterAll', () => {
          engine.events.request('pipeline:generateAll', () => {
            engine.events.emit('outputDone');
          });
        });

        let plugin = engine.plugins.createPlugin('cmdcontrollerplugin', {});
        plugin.registerActionForEvent("embark:engine:started", async (_, cb) => {
          try {
            await Promise.all([
              engine.events.request2("blockchain:node:start", engine.config.blockchainConfig),
              engine.events.request2("communication:node:start", engine.config.communicationConfig),
              engine.events.request2("namesystem:node:start", engine.config.namesystemConfig)
            ]);
          } catch (e) {
            return cb(e);
          }
          cb();
        });

        engine.startEngine(async () => {
          try {
            await compileAndDeploySmartContracts(engine);
          } catch (e) {
            return callback(e);
          }
          callback();
        });
      },
      function waitForWriteFinish(callback) {
        if (options.onlyCompile) {
          engine.logger.info("Finished compiling".underline);
          return callback(null, true);
        }
        engine.logger.info("Finished deploying".underline);
        engine.events.on('outputDone', (err) => {
          engine.logger.info(__("Finished building").underline);
          callback(err, true);
        });

      }
    ], function (err, canExit) {
      if (err) {
        engine.logger.error(err.message || err);
      }
      // TODO: this should be moved out and determined somewhere else
      if (canExit || !engine.config.contractsConfig.afterDeploy || !engine.config.contractsConfig.afterDeploy.length) {
        process.exit(err ? 1 : 0);
      }
      engine.logger.info(__('Waiting for after deploy to finish...'));
      engine.logger.info(__('You can exit with CTRL+C when after deploy completes'));
    });
  }

  console(options) {
    this.context = options.context || [constants.contexts.run, constants.contexts.console];
    const REPL = require('./dashboard/repl.js');
    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel,
      context: this.context,
      singleUseAuthToken: options.singleUseAuthToken,
      webpackConfigName: options.webpackConfigName,
      package: pkg
    });

    const isSecondaryProcess = (engine) => { return engine.ipc.connected && engine.ipc.isClient(); };

    async.waterfall([
      callback => {
        engine.init({}, callback);
      },
      callback => {
        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");
        engine.registerModuleGroup("consoleComponents");

        // TODO: replace with individual plugins
        engine.registerModuleGroup("namesystem");
        engine.registerModuleGroup("communication");
        engine.registerModuleGroup("blockchain");
        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModuleGroup("pipeline");
        engine.registerModuleGroup("webserver");
        engine.registerModuleGroup("filewatcher");
        engine.registerModuleGroup("storage");
        if (!isSecondaryProcess(engine)) {
          engine.registerModuleGroup("cockpit");
        }
        engine.registerModulePackage('embark-deploy-tracker', { plugins: engine.plugins });
        engine.registerModulePackage("embark-debugger");

        // load custom plugins
        engine.loadDappPlugins();
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        callback();
      },
      callback => {
        if (isSecondaryProcess(engine)) {
          return callback();
        }

        let plugin = engine.plugins.createPlugin('cmdcontrollerplugin', {});

        plugin.registerActionForEvent("embark:engine:started", async (_params, cb) => {
          await engine.events.request2("blockchain:node:start", engine.config.blockchainConfig);
          try {
            await Promise.all([
              engine.events.request2("storage:node:start", engine.config.storageConfig),
              engine.events.request2("communication:node:start", engine.config.communicationConfig),
              engine.events.request2("namesystem:node:start", engine.config.namesystemConfig)
            ]);
          } catch (e) {
            return cb(e);
          }
          cb();
        });

        engine.events.on('outputDone', function () {
          engine.logger.info((__("Looking for documentation? You can find it at") + " ").cyan + "http://embark.status.im/docs/".green.underline + ".".cyan);
          engine.logger.info(__("Ready").underline);
          engine.events.emit("status", __("Ready").green);
        });

        engine.startEngine(async () => {
          try {
            await compileAndDeploySmartContracts(engine);
            await setupCargoAndWatcher(engine);
          } catch (e) {
            return callback(e);
          }

          callback();
        });
      },
      function startREPL(callback) {
        new REPL({
          events: engine.events,
          env: engine.env,
          ipc: engine.ipc,
          useDashboard: false,
          logger: engine.logger
        }).start(callback);
      }
    ], function (err, _result) {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
        process.exit(1);
      } else {
        engine.events.emit('firstDeploymentDone');
      }
    });
  }

  graph(options) {
    this.context = options.context || [constants.contexts.graph];
    options.onlyCompile = true;

    const engine = new Engine({
      env: options.env,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      context: this.context,
      package: pkg
    });

    async.waterfall([
      function (callback) {
        engine.init({}, callback);
      },
      function (callback) {
        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");

        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModulePackage("embark-graph");

        // load custom plugins
        engine.loadDappPlugins();
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        engine.startEngine(async () => {
          let contractsFiles = await engine.events.request2("config:contractsFiles");
          let compiledContracts = await engine.events.request2("compiler:contracts:compile", contractsFiles);
          let _contractsConfig = await engine.events.request2("config:contractsConfig");
          let contractsConfig = cloneDeep(_contractsConfig);
          await engine.events.request2("contracts:build", contractsConfig, compiledContracts);

          callback();
        });
      }
    ], (err) => {
      if (err) {
        engine.logger.error(err.message);
        engine.logger.info(err.stack);
      } else {
        engine.events.request("graph:create", options, () => {
          engine.logger.info(__("Done. %s generated", options.output).underline);
        });
      }

      process.exit(err ? 1 : 0);
    });

  }

  async reset(options) {
    const embarkConfig = require(dappPath(options.embarkConfig || 'embark.json'));

    let removePaths = [];
    let defaultPaths = [...defaultResetPaths];

    defaultPaths.push(embarkConfig.buildDir);
    if (embarkConfig.generationDir) {
      defaultPaths.push(embarkConfig.generationDir);
    }

    if (embarkConfig.options && embarkConfig.options.reset) {
      if (embarkConfig.options.reset.defaults) {
        removePaths = removePaths.concat(defaultPaths);
      }
      if (embarkConfig.options.reset.files) {
        removePaths = removePaths.concat(embarkConfig.options.reset.files);
      }
    } else {
      removePaths = defaultPaths;
    }
    removePaths = [
      ...new Set(removePaths.map(path => {
        return path.charAt(path.length - 1) === '/' ? path.substr(0, path.length - 1) : path;
      }))
    ];
    await embarkReset({ removePaths });
  }

  ejectWebpack() {
    const embarkConfig = embarkPath("dist/lib/modules/basic-pipeline/webpack.config.js");
    const dappConfig = dappPath('webpack.config.js');
    fs.copyPreserve(embarkConfig, dappConfig);
    console.log(__('webpack config ejected to:').dim.yellow);
    console.log(`${dappConfig}`.green);
    const embarkOverrides = embarkPath("dist/lib/modules/basic-pipeline/babel-loader-overrides.js");
    const dappOverrides = dappPath('babel-loader-overrides.js');
    fs.copyPreserve(embarkOverrides, dappOverrides);
    console.log(__('webpack overrides ejected to:').dim.yellow);
    console.log(`${dappOverrides}`.green);
  }

  scaffold(options) {
    this.context = options.context || [constants.contexts.scaffold];

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
      webpackConfigName: options.webpackConfigName,
      package: pkg
    });

    async.waterfall([
      function initEngine(callback) {
        engine.init({}, callback);
      },
      function (callback) {
        engine.startService("libraryManager").installAll((err) => callback(err ? err : null));
      },
      function startServices(callback) {
        engine.startService("scaffolding");
        callback();
      },
      function generateContract(callback) {
        engine.events.request('scaffolding:generate:contract', options, function (files) {
          files.forEach(file => engine.events.request('config:contractsFiles:add', file));
          callback();
        });
      },
      function initEngineServices(callback) {
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }
        engine.startService("web3");
        engine.startService("processManager");
        engine.startService("codeRunner");
        engine.startService("deployment", { onlyCompile: true });

        callback();
      },
      function deploy(callback) {
        engine.events.request('deploy:contracts', function (err) {
          callback(err);
        });
      },
      function generateUI(callback) {
        engine.events.request("scaffolding:generate:ui", options, () => {
          callback();
        });
      }
    ], function (err) {
      if (err) {
        engine.logger.error(__("Error generating the UI: "));
        engine.logger.error(err.message || err);
      }
      engine.logger.info(__("finished generating the UI").underline);
      engine.logger.info(__("To see the result, execute {{cmd}} and go to /{{contract}}.html", { cmd: 'embark run'.underline, contract: options.contract }));

      process.exit(err ? 1 : 0);
    });
  }

  upload(options) {
    this.context = options.context || [constants.contexts.upload, constants.contexts.build];

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
      webpackConfigName: options.webpackConfigName,
      package: pkg
    });

    let platform;

    async.waterfall([
      function initEngine(callback) {
        engine.init({}, () => {
          if (engine.config.embarkConfig.config.storage === false || engine.config.storageConfig.enabled === false) {
            engine.logger.error(__('Storage configuration is disabled in embark.json. Please provide a storage file before uploading'));
            engine.logger.info(__('You can find an example here: %s', 'https://github.com/embark-framework/embark/blob/master/templates/demo/config/storage.js'.underline));
            process.exit(1);
          }
          platform = engine.config.storageConfig.upload.provider;
          if (options.env === 'development') {
            engine.logger.warn(__('Uploading using the development environment. Did you forget to add an environment? eg: `embark upload testnet`'));
          }
          callback();
        });
      },
      function startServices(callback) {
        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");

        engine.registerModuleGroup("namesystem");
        engine.registerModuleGroup("communication");
        engine.registerModuleGroup("blockchain");
        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModuleGroup("pipeline");
        engine.registerModuleGroup("webserver");
        engine.registerModuleGroup("filewatcher");
        engine.registerModuleGroup("storage");
        engine.registerModulePackage('embark-deploy-tracker', { plugins: engine.plugins });

        // load custom plugins
        engine.loadDappPlugins();
        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }

        const plugin = engine.plugins.createPlugin('cmdcontrollerplugin', {});
        plugin.registerActionForEvent("embark:engine:started", async (_params, cb) => {
          try {
            await engine.events.request2("blockchain:node:start", engine.config.blockchainConfig);
            await Promise.all([
              engine.events.request2("storage:node:start", engine.config.storageConfig),
              engine.events.request2("communication:node:start", engine.config.communicationConfig),
              engine.events.request2("namesystem:node:start", engine.config.namesystemConfig)
            ]);
          } catch (e) {
            return cb(e);
          }
          cb();
        });

        engine.startEngine(async () => {
          await compileAndDeploySmartContracts(engine);

          let storageConfig = await engine.events.request2("config:storageConfig");
          await engine.events.request2("storage:upload", storageConfig.upload.provider);

          callback();
        });
      }
    ], function (err) {
      if (err) {
        if (err.message) {
          engine.logger.error(err.message);
          engine.logger.debug(err.stack);
        }
        engine.logger.error(err);
      } else {
        engine.logger.info((__("finished building DApp and deploying to") + " " + platform).underline);
      }

      // needed due to child processes
      process.exit(err ? 1 : 0);
    });
  }

  runTests(options) {
    this.context = [constants.contexts.test];

    const engine = new Engine({
      env: options.env,
      client: options.client,
      locale: options.locale,
      version: this.version,
      embarkConfig: options.embarkConfig || 'embark.json',
      logFile: options.logFile,
      logLevel: options.logLevel || LogLevels.warn,
      context: this.context,
      useDashboard: false,
      webpackConfigName: options.webpackConfigName,
      ipcRole: 'client',
      interceptLogs: false,
      package: pkg
    });

    async.waterfall([
      function initEngine(next) {
        engine.init({}, next);
      },
      function loadModules(next) {
        engine.registerModuleGroup("coreComponents");
        engine.registerModuleGroup("stackComponents");

        engine.registerModuleGroup("blockchain");
        engine.registerModuleGroup("compiler");
        engine.registerModuleGroup("contracts");
        engine.registerModuleGroup("pipeline");
        engine.registerModuleGroup("tests", options);
        engine.registerModulePackage('embark-deploy-tracker', { plugins: engine.plugins, trackContracts: false });
        engine.registerModuleGroup("namesystem");
        engine.registerModuleGroup("storage");
        engine.registerModuleGroup("communication");
        next();
      },
      function loadDappPlugins(next) {
        // load custom plugins
        engine.loadDappPlugins();

        let pluginList = engine.plugins.listPlugins();
        if (pluginList.length > 0) {
          engine.logger.info(__("loaded plugins") + ": " + pluginList.join(", "));
        }
        next();
      },
      function startEngine(next) {
        engine.startEngine(next);
      },
      function startNodes(next) {
        Promise.all([
          engine.events.request2("storage:node:start", engine.config.storageConfig),
          engine.events.request2("communication:node:start", engine.config.communicationConfig),
          engine.events.request2("namesystem:node:start", engine.config.namesystemConfig)
        ]).then(() => {
          next();
        }).catch(next);
      },
      function setupTestEnvironment(next) {
        engine.events.request2('tests:run', options, next);
      }
    ], (err, passes, fails) => {
      if (err) {
        engine.logger.error(`Error occurred while running tests: ${err.message || err}`);
      }

      process.exit(err || (fails > 0) ? 1 : 0);
    });
  }
}

module.exports = EmbarkController;

async function compileAndDeploySmartContracts(engine) {
  try {
    let contractsFiles = await engine.events.request2("config:contractsFiles");
    let compiledContracts = await engine.events.request2("compiler:contracts:compile", contractsFiles);
    let _contractsConfig = await engine.events.request2("config:contractsConfig");
    let contractsConfig = cloneDeep(_contractsConfig);
    let [contractsList, contractDependencies] = await engine.events.request2("contracts:build", contractsConfig, compiledContracts);
    await engine.events.request2("deployment:contracts:deploy", contractsList, contractDependencies);
    await engine.events.request2('pipeline:generateAll');
    engine.events.emit('outputDone');
  } catch (e) {
    console.log(e);
  }
}

async function setupCargoAndWatcher(engine) {
  const cargo = async.cargo(async (tasks) => {
    if (tasks.includes('contract') || tasks.includes('config')) {
      try {
        return await compileAndDeploySmartContracts(engine);
      } catch (err) {
        engine.logger.error(err);
        return;
      }
    }

    await engine.events.request2('pipeline:generateAll');
    engine.events.emit('outputDone');
  });

  let fileTimeout;
  engine.events.on('file-event', ({ fileType, _path }) => {
    clearTimeout(fileTimeout);
    // Throttle file changes so we re-write only once for all files
    fileTimeout = setTimeout(async () => {
      cargo.push(fileType);
    }, 50);
  });

  await engine.events.request2("watcher:start");
}
