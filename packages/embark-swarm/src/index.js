import { __ } from 'embark-i18n';
const UploadSwarm = require('./upload.js');
const SwarmAPI = require('swarm-api');
const StorageProcessesLauncher = require('embark-storage/processes');
const constants = require('embark-core/constants');
require('colors');
import { dappPath, buildUrl } from 'embark-utils';
import * as path from 'path';

class Swarm {

  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = embark.config.buildDir;
    this.storageConfig = embark.config.storageConfig;
    this.host = this.storageConfig.host;
    this.port = this.storageConfig.port;
    this.embark = embark;
    this.fs = embark.fs;
    this.isServiceRegistered = false;
    this.addedToConsole = false;
    this.storageProcessesLauncher = null;
    this.usingRunningNode = false;
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    this.webServerConfig = embark.config.webServerConfig;
    this.blockchainConfig = embark.config.blockchainConfig;

    const cantDetermineUrl = this.storageConfig.upload.provider !== 'swarm' && !this.storageConfig.dappConnection.some(connection => connection.provider === 'swarm');

    if (this.isSwarmEnabledInTheConfig() && cantDetermineUrl) {
      console.warn('\n===== Swarm module will not be loaded =====');
      console.warn(`Swarm is enabled in the config, however the config is not setup to provide a URL for swarm and therefore the Swarm module will not be loaded. Please either change the ${'config/storage > upload'.bold} setting to Swarm or add the Swarm config to the ${'config/storage > dappConnection'.bold} array. Please see ${'https://embark.status.im/docs/storage_configuration.html'.underline} for more information.\n`);
      return this.events.emit("swarm:process:started", null, false);
    }
    if (!this.isSwarmEnabledInTheConfig()) {
      this.embark.registerConsoleCommand({
        matches: cmd => cmd === "swarm" || cmd.indexOf('swarm ') === 0,
        process: (_cmd, cb) => {
          console.warn(__(`Swarm is disabled or not configured. Please see %s for more information.`, 'https://embark.status.im/docs/storage_configuration.html'.underline));
          cb();
        }
      });
      return this.events.emit("swarm:process:started", null, false);
    }

    this.providerUrl = buildUrl(this.storageConfig.upload.protocol, this.storageConfig.upload.host, this.storageConfig.upload.port);

    this.getUrl = this.storageConfig.upload.getUrl || this.providerUrl + '/bzz:/';

    this.swarm = new SwarmAPI({gateway: this.providerUrl});

    this.setServiceCheck();
    this.registerUploadCommand();
    this.listenToCommands();
    this.registerConsoleCommands();
    this.events.request("processes:register", "swarm", {
      launchFn: (cb) => {
        if(this.usingRunningNode) {
          return cb(__("Swarm process is running in a separate process and cannot be started by Embark."));
        }
        this.startProcess((err, newProcessStarted) => {
          this.addObjectToConsole();
          this.events.emit("swarm:process:started", err, newProcessStarted);
          cb();
        });
      },
      stopFn: (cb) => {
        if(this.usingRunningNode) {
          return cb(__("Swarm process is running in a separate process and cannot be stopped by Embark."));
        }
        this.stopProcess(cb);
      }
    });
    this.events.request("processes:launch", "swarm", (err, msg) => {
      if (err) {
        return this.logger.error(err);
      }
      if (msg) {
        this.logger.info(msg);
      }
    });

    // TODO: it will have the issue of waiting for the ipfs to start when the code is generator
    // TODO: could be solved by having a list of services to wait on before attempting to execute code in the console
    this.addProviderToEmbarkJS();
  }

  addObjectToConsole() {
    if (this.addedToConsole) return;
    this.addedToConsole = true;
    this.events.emit("runcode:register", "swarm", this.swarm);
  }

  setServiceCheck() {
    if (this.isServiceRegistered) return;
    this.isServiceRegistered = true;
    let self = this;

    this.events.on('check:backOnline:Swarm', function () {
      self.logger.info(__('Swarm node detected...'));
    });

    this.events.on('check:wentOffline:Swarm', function () {
      self.logger.info(__('Swarm node is offline...'));
    });

    self.events.request("services:register", 'Swarm', function (cb) {
      self.logger.trace(`Checking Swarm availability on ${self.providerUrl}...`);
      self._checkService((err, result) => {
        if (err) {
          self.logger.trace("Check Swarm availability error: " + err);
          return cb({name: "Swarm ", status: 'off'});
        }
        self.logger.trace("Swarm " + (result ? '' : 'un') + "available");
        return cb({name: "Swarm ", status: result ? 'on' : 'off'});
      });
    });
  }

  _checkService(cb) {
    this.swarm.isAvailable(cb);
  }

  addProviderToEmbarkJS() {
    let linkedModulePath = path.join(this.modulesPath, 'embarkjs-swarm');
    if (process.platform === 'win32') linkedModulePath = linkedModulePath.replace(/\\/g, '\\\\');

    this.events.request('version:downloadIfNeeded', 'embarkjs-swarm', (err, location) => {
      if (err) {
        this.logger.error(__('Error downloading embarkjs-swarm'));
        throw err;
      }

      const code = `
        const __embarkSwarm = require('${linkedModulePath}');
        EmbarkJS.Storage.registerProvider('swarm', __embarkSwarm.default || __embarkSwarm);
      `;

      this.embark.addProviderInit("storage", code, () => { return true; });
      this.embark.addConsoleProviderInit("storage", code, () => { return true; });

      this.embark.addGeneratedCode((cb) => {
        return cb(null, code, 'embarkjs-swarm', location);
      });
    });
  }

  startProcess(callback) {
    this.swarm.isAvailable((err, isAvailable) => {
      if (!err || isAvailable) {
        this.usingRunningNode = true;
        this.logger.info("Swarm node found, using currently running node");
        return callback(null, false);
      }
      this.logger.info("Swarm node not found, attempting to start own node");
      let self = this;
      if(this.storageProcessesLauncher === null) {
        this.storageProcessesLauncher = new StorageProcessesLauncher({
          logger: self.logger,
          events: self.events,
          storageConfig: self.storageConfig,
          webServerConfig: self.webServerConfig,
          corsParts: self.embark.config.corsParts,
          blockchainConfig: self.blockchainConfig,
          embark: self.embark
        });
      }
      self.logger.trace(`Storage module: Launching swarm process...`);
      return this.storageProcessesLauncher.launchProcess('swarm', (err) => {
        callback(err, true);
      });
    });
  }

  stopProcess(cb) {
    if(!this.storageProcessesLauncher) return cb();
    this.storageProcessesLauncher.stopProcess("swarm", cb);
  }

  registerUploadCommand() {
    const self = this;
    this.embark.registerUploadCommand('swarm', (cb) => {
      let upload_swarm = new UploadSwarm({
        buildDir: self.buildDir || 'dist/',
        storageConfig: self.storageConfig,
        providerUrl: self.providerUrl,
        swarm: self.swarm,
        env: self.embark.env
      });

      upload_swarm.deploy(cb);
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('logs:swarm:enable', (cb) => {
      this.events.emit('logs:storage:enable');
      return cb(null, 'Enabling Swarm logs');
    });

    this.events.setCommandHandler('logs:swarm:disable', (cb) => {
      this.events.emit('logs:storage:disable');
      return cb(null, 'Disabling Swarm logs');
    });
  }

  registerConsoleCommands() {
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

  isSwarmEnabledInTheConfig() {
    let {enabled, available_providers, dappConnection, upload} = this.storageConfig;
    return (enabled || this.embark.currentContext.includes(constants.contexts.upload)) &&
      available_providers.includes('swarm') &&
      (
        dappConnection.some(c => c.provider === 'swarm') ||
        upload.provider === "swarm"
      );
  }

}

module.exports = Swarm;
