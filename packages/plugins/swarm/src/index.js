import {__} from 'embark-i18n';
import {buildUrlFromConfig} from 'embark-utils';
const UploadSwarm = require('./upload.js');
const SwarmAPI = require('swarm-api');
const StorageProcessesLauncher = require('./storageProcessesLauncher');
const constants = require('embark-core/constants');
require('colors');

class Swarm {

  constructor(embark) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = embark.config.buildDir;
    this.embark = embark;
    this.storageProcessesLauncher = null;
    this.usingRunningNode = false;
    this._config = null; // backing variable for config property
    this._enabled = null; // backing variable for enabled property

    this.storageConfig = embark.config.storageConfig;
    this.webServerConfig = embark.config.webServerConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.embarkConfig = embark.config.embarkConfig;

    if (this.enabled && this.config === {}) {
      console.warn('\n===== Swarm module will not be loaded =====');
      console.warn(`Swarm is enabled in the config, however the config is not setup to provide a URL for swarm and therefore the Swarm module will not be loaded. Please either change the ${'config/storage > upload'.bold} setting to Swarm or add the Swarm config to the ${'config/storage > dappConnection'.bold} array. Please see ${'https://framework.embarklabs.io/docs/storage_configuration.html'.underline} for more information.\n`);
      this.events.emit("swarm:process:started", null, false);
      return;
    }
    if (!this.enabled) {
      this.embark.registerConsoleCommand({
        matches: cmd => cmd === "swarm" || cmd.indexOf('swarm ') === 0,
        process: (_cmd, cb) => {
          console.warn(__(`Swarm is disabled or not configured. Please see %s for more information.`, 'https://framework.embarklabs.io/docs/storage_configuration.html'.underline));
          cb();
        }
      });
      this.events.emit("swarm:process:started", null, false);
      return;
    }

    this.embark.events.setCommandHandler("module:swarm:reset", (cb) => {
      this.events.request("processes:stop", "swarm", (err) => {
        if (err) {
          this.logger.error(__('Error stopping Swarm process'), err);
        }
        this.init(cb);
      });
    });

    this.providerUrl = buildUrlFromConfig(this.config);
    this.swarm = new SwarmAPI({gateway: this.providerUrl});

    this.setupSwarmAPI();
    this.setupEmbarkJS();

    this.events.request("storage:node:register", "swarm", (readyCb) => {
      this.events.request("processes:register", "storage", {
        launchFn: (cb) => {
          if (this.usingRunningNode) {
            return cb(__("Swarm process is running in a separate process and cannot be started by Embark."));
          }
          this.startProcess((err, newProcessStarted) => {
            this.events.emit("swarm:process:started", err, newProcessStarted);
            cb(err);
          });
        },
        stopFn: (cb) => {
          if (this.usingRunningNode) {
            return cb(__("Swarm process is running in a separate process and cannot be stopped by Embark."));
          }
          this.stopProcess(cb);
        }
      });
      this.events.request("processes:launch", "storage", (err) => {
        readyCb(err);
      });
      this.registerServiceCheck();
    });

    this.events.request("storage:upload:register", "swarm", (readyCb) => {
      let upload_swarm = new UploadSwarm({
        buildDir: this.buildDir || 'dist/',
        storageConfig: this.config.storageConfig,
        providerUrl: this.providerUrl,
        swarm: this.swarm,
        env: this.embark.env
      });

      upload_swarm.deploy(readyCb);
    });

    this.embark.registerConsoleCommand({
      matches: ['log swarm on'],
      process: (cmd, callback) => {
        this.events.request('logs:swarm:enable', callback);
      }
    });
    this.embark.registerConsoleCommand({
      matches: ['log swarm off'],
      process: (cmd, callback) => {
        this.events.request('logs:swarm:disable', callback);
      }
    });
  }

  setupSwarmAPI() {
    this.events.request("runcode:whitelist", 'swarm-api', () => {});
    this.events.on("storage:started", async () => {
      await this.events.request2("runcode:register", "swarm", this.swarm);
      await this.events.request2('console:register:helpCmd', {
        cmdName: "swarm",
        cmdHelp: __("instantiated swarm-api object configured to the current environment (available if swarm is enabled)")
      });
    });
  }

  async setupEmbarkJS() {
    this.events.request("embarkjs:plugin:register", 'storage', 'swarm', 'embarkjs-swarm');
    await this.events.request2("embarkjs:console:register", 'storage', 'swarm', 'embarkjs-swarm');

    this.events.on("storage:started", () => {
      let config = this.embark.config.storageConfig.dappConnection || [];
      this.events.request("embarkjs:console:setProvider", 'storage', 'swarm', config);
    });
  }

  get config() {

    if (this._config) {
      return this._config;
    }

    let {dappConnection, upload} = this.storageConfig;
    const {currentContext} = this.embark;

    if (!this.enabled) {
      this._config = {};
      return this._config;
    }

    if (currentContext.includes(constants.contexts.upload)) {
      this._config = upload;
      return this._config;
    }
    this._config = dappConnection.find(c => c.provider === 'swarm') || {};
    return this._config;
  }

  get enabled() {
    if (this._enabled !== null) {
      return this._enabled;
    }

    let {enabled, available_providers, dappConnection, upload} = this.storageConfig;
    this._enabled = (enabled || this.embark.currentContext.includes(constants.contexts.upload)) &&
      available_providers.includes('swarm') &&
      (
        dappConnection.some(c => c.provider === 'swarm') ||
        upload.provider === "swarm"
      );

    return this._enabled;
  }

  registerServiceCheck() {
    this.events.on('check:backOnline:Swarm', () => {
      this.logger.info(__('Swarm node detected...'));
    });

    this.events.on('check:wentOffline:Swarm', () => {
      this.logger.info(__('Swarm node is offline...'));
    });

    this.events.request("services:register", 'Swarm', (cb) => {
      this.logger.trace(`Checking Swarm availability on ${this.providerUrl}...`);
      this._checkService((err, result) => {
        if (err) {
          this.logger.trace("Check Swarm availability error: " + err);
          return cb({name: "Swarm ", status: 'off'});
        }
        this.logger.trace("Swarm " + (result ? '' : 'un') + "available");
        return cb({name: "Swarm ", status: result ? 'on' : 'off'});
      });
    });
  }


  _checkService(cb) {
    this.swarm.isAvailable(cb);
  }

  startProcess(callback) {
    this.swarm.isAvailable((err, isAvailable) => {
      if (!err || isAvailable) {
        this.usingRunningNode = true;
        this.logger.info("Swarm node found, using currently running node");
        return callback(null, false);
      }
      this.logger.info("Swarm node not found, attempting to start own node");
      if (this.storageProcessesLauncher === null) {
        this.storageProcessesLauncher = new StorageProcessesLauncher({
          logger: this.logger,
          events: this.events,
          storageConfig: this.storageConfig,
          webServerConfig: this.webServerConfig,
          corsParts: this.embark.config.corsParts,
          blockchainConfig: this.blockchainConfig,
          embark: this.embark
        });
      }
      this.logger.trace(`Storage module: Launching swarm process...`);
      return this.storageProcessesLauncher.launchProcess('swarm', (err) => {
        callback(err, true);
      });
    });
  }

  stopProcess(cb) {
    if (!this.storageProcessesLauncher) return cb();
    this.storageProcessesLauncher.stopProcess("swarm", cb);
  }
}

module.exports = Swarm;
