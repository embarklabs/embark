import { __ } from 'embark-i18n';
const UploadIPFS = require('./upload.js');
const IpfsApi = require('ipfs-api');
const StorageProcessesLauncher = require('embark-storage/processes');
const constants = require('embark-core/constants');
import { buildUrlFromConfig, dappPath, embarkPath, getJson } from 'embark-utils';
import * as path from 'path';

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embarkConfig = embark.config.embarkConfig;
    this.config = embark.config;
    this.namesystemConfig = embark.config.namesystemConfig;
    this.embark = embark;
    this.fs = embark.fs;
    this.isServiceRegistered = false;
    this.addedToConsole = false;
    this.storageProcessesLauncher = null;
    this.usingRunningNode = false;
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);
    this.registered = false;

    this.webServerConfig = embark.config.webServerConfig;
    this.blockchainConfig = embark.config.blockchainConfig;

    this.embark.events.setCommandHandler("module:ipfs:reset", (cb) => {
      this.events.request("processes:stop", "ipfs", (err) => {
        if (err) {
          this.logger.error(__('Error stopping IPFS process'), err);
        }
        this.init(cb);
      });
    });

    this.init();
  }

  init(callback = () => {}) {
    if (!this.isIpfsStorageEnabledInTheConfig()) {
      this.events.emit("ipfs:process:started", null, false);
      return callback();
    }
    if (!this.registered) {
      this.registered = true;
      this.setServiceCheck();
      this.registerUploadCommand();
      this.listenToCommands();
      this.registerConsoleCommands();
      this.events.request("processes:register", "ipfs", {
        launchFn: (cb) => {
          if(this.usingRunningNode) {
            return cb(__("IPFS process is running in a separate process and cannot be started by Embark."));
          }
          this.startProcess((err, newProcessStarted) => {
            this.addObjectToConsole();
            this.events.emit("ipfs:process:started", err, newProcessStarted);
            cb();
          });
        },
        stopFn: (cb) => {
          if(this.usingRunningNode) {
            return cb(__("IPFS process is running in a separate process and cannot be stopped by Embark."));
          }
          this.stopProcess(cb);
        }
      });
    }

    this.events.request("processes:launch", "ipfs", (err, msg) => {
      if (err) {
        this.logger.error(err);
        return callback(err);
      }
      if (msg) {
        this.logger.info(msg);
      }
      callback();
    });

    // TODO: it will have the issue of waiting for the ipfs to start when the code is generator
    // TODO: could be solved by having a list of services to wait on before attempting to execute code in the console
    this.addStorageProviderToEmbarkJS();
  }

  downloadIpfsApi(cb) {
    this.events.request("version:get:ipfs-api", (ipfsApiVersion) => {
      let currentIpfsApiVersion = require('../package.json').dependencies["ipfs-api"];
      if (ipfsApiVersion === currentIpfsApiVersion) {
        const nodePath = embarkPath('node_modules');
        const ipfsPath = require.resolve("ipfs-api", {paths: [nodePath]});
        return cb(null, ipfsPath);
      }
      this.events.request("version:getPackageLocation", "ipfs-api", ipfsApiVersion, (err, location) => {
        cb(err, dappPath(location));
      });
    });
  }

  setServiceCheck() {
    if (this.isServiceRegistered) return;
    this.isServiceRegistered = true;
    let self = this;

    self.events.on('check:backOnline:IPFS', function () {
      self.logger.info(__('IPFS node detected') + '...');
    });

    self.events.on('check:wentOffline:IPFS', function () {
      self.logger.info(__('IPFS node is offline') + '...');
    });

    self.events.request("services:register", 'IPFS', function (cb) {
      self._checkService((err, body) => {
        if (err) {
          self.logger.trace("IPFS unavailable");
          return cb({name: "IPFS ", status: 'off'});
        }
        if (body.Version) {
          self.logger.trace("IPFS available");
          return cb({name: ("IPFS " + body.Version), status: 'on'});
        }
        self.logger.trace("IPFS available");
        return cb({name: "IPFS ", status: 'on'});
      });
    });
  }

  _getNodeUrlConfig() {
    if (this.config.storageConfig.upload.provider === 'ipfs') {
      return this.config.storageConfig.upload;
    }

    for (let connection of this.config.storageConfig.dappConnection) {
      if (connection.provider === 'ipfs') {
        return connection;
      }
    }
  }

  _getNodeUrl() {
    return buildUrlFromConfig(this._getNodeUrlConfig()) + '/api/v0/version';
  }

  _checkService(cb) {
    let url = this._getNodeUrl();
    getJson(url, cb);
  }

  addStorageProviderToEmbarkJS() {
    this.events.request('version:downloadIfNeeded', 'ipfs-api', (err, location) => {
      if (err) {
        this.logger.error(__('Error downloading IPFS API'));
        return this.logger.error(err.message || err);
      }
      this.events.request('code-generator:ready', () => {
        this.events.request('code-generator:symlink:generate', location, 'ipfs-api', (err, _symlinkDest) => {
          if (err) {
            this.logger.error(__('Error creating a symlink to IPFS API'));
            return this.logger.error(err.message || err);
          }

          this.events.emit('runcode:register', 'IpfsApi', require('ipfs-api'), () => {

          });
        });
      });

      let linkedModulePath = path.join(this.modulesPath, 'embarkjs-ipfs');
      if (process.platform === 'win32') linkedModulePath = linkedModulePath.replace(/\\/g, '\\\\');

      const code = `
        const __embarkIPFS = require('${linkedModulePath}');
        EmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS.default || __embarkIPFS);
      `;

      this.events.request('version:downloadIfNeeded', 'embarkjs-ipfs', (err, location) => {
        if (err) {
          this.logger.error(__('Error downloading embarkjs-ipfs'));
          throw err;
        }
        this.embark.addProviderInit("storage", code, () => { return true; });
        this.embark.addConsoleProviderInit("storage", code, () => { return true; });
        this.embark.addGeneratedCode((cb) => {
          return cb(null, code, `embarkjs-ipfs`, location);
        });
      });
    });
  }

  addObjectToConsole() {
    if(this.addedToConsole) return;
    this.addedToConsole = true;

    const {host, port} = this._getNodeUrlConfig();
    let ipfs = IpfsApi(host, port);
    this.events.emit("runcode:register", "ipfs", ipfs);
  }

  startProcess(callback) {
    this._checkService((err) => {
      if (!err) {
        this.usingRunningNode = true;
        this.logger.info("IPFS node found, using currently running node");
        return callback(null, false);
      }
      this.logger.info("IPFS node not found, attempting to start own node");
      let self = this;
      if(this.storageProcessesLauncher === null) {
        this.storageProcessesLauncher = new StorageProcessesLauncher({
          logger: self.logger,
          events: self.events,
          storageConfig: self.config.storageConfig,
          webServerConfig: self.webServerConfig,
          blockchainConfig: self.blockchainConfig,
          corsParts: self.embark.config.corsParts,
          embark: self.embark
        });
      }
      self.logger.trace(`Storage module: Launching ipfs process...`);
      return this.storageProcessesLauncher.launchProcess('ipfs', (err) => {
        callback(err, true);
      });
    });
  }
  stopProcess(cb) {
    if(!this.storageProcessesLauncher) return cb();
    this.storageProcessesLauncher.stopProcess("ipfs", cb);
  }

  registerUploadCommand() {
    const self = this;
    this.embark.registerUploadCommand('ipfs', (cb) => {
      let upload_ipfs = new UploadIPFS({
        buildDir: self.buildDir || 'dist/',
        storageConfig: self.config.storageConfig,
        configIpfsBin: self.config.storageConfig.ipfs_bin || "ipfs",
        env: this.embark.env
      });

      upload_ipfs.deploy(cb);
    });
  }

  listenToCommands() {
    this.events.setCommandHandler('logs:ipfs:enable', (cb) => {
      this.events.emit('logs:storage:enable');
      return cb(null, 'Enabling IPFS logs');
    });

    this.events.setCommandHandler('logs:ipfs:disable', (cb) => {
      this.events.emit('logs:storage:disable');
      return cb(null, 'Disabling IPFS logs');
    });
  }

  registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      matches: ['log ipfs on'],
      process: (cmd, callback) => {
        this.events.request('logs:ipfs:enable', callback);
      }
    });
    this.embark.registerConsoleCommand({
      matches: ['log ipfs off'],
      process: (cmd, callback) => {
        this.events.request('logs:ipfs:disable', callback);
      }
    });
  }

  isIpfsStorageEnabledInTheConfig() {
    let {enabled, available_providers, dappConnection, upload} = this.config.storageConfig;
    return (enabled || this.embark.currentContext.includes(constants.contexts.upload)) &&
      (
        available_providers.includes('ipfs') &&
        (
          dappConnection.some(c => c.provider === 'ipfs') ||
          upload.provider === 'ipfs'
        )
      );
  }
}

module.exports = IPFS;
