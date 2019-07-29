import { __ } from 'embark-i18n';
const IpfsApi = require('ipfs-api');
const StorageProcessesLauncher = require('./storageProcessesLauncher.js');
import { buildUrlFromConfig, getJson } from 'embark-utils';

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.logger = embark.logger;
    // this.buildDir = options.buildDir;
    this.embarkConfig = embark.config.embarkConfig;
    this.config = embark.config;
    // this.namesystemConfig = embark.config.namesystemConfig;
    this.storageConfig = embark.config.storageConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.webServerConfig = embark.config.webServerConfig;
    this.embark = embark;
    this.fs = embark.fs;
    // this.addedToConsole = false;
    this.storageProcessesLauncher = null;
    // this.usingRunningNode = false;
    // this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);
    this.registered = false;

    this.events.request("runcode:whitelist", 'ipfs-api', () => { });
    this.events.on("storage:started", this.registerIpfsObject.bind(this));

    this.events.request("storage:node:register", "ipfs", (readyCb) => {
      console.dir("--- ipfs readyCb")
      console.dir('--- registering ipfs node')
      this.events.request('processes:register', 'storage', {
        launchFn: (cb) => {
          // this.startProcess(readyCb);
          this.startProcess(cb);
        },
        stopFn: (cb) => { this.stopProcess(cb); }
      });
      this.events.request("processes:launch", "storage", (err) => {
        readyCb()
      });
      this.registerServiceCheck()
    });
  }

  // TODO:
  // ipfs plugin
  // * register upload command
  // V register storage process
  // V add embarkjs in the console
  // * generate embarkjs storage artifact

  async registerIpfsObject() {
    const { host, port } = this._getNodeUrlConfig();
    let ipfs = IpfsApi(host, port);
    await this.events.request2("runcode:register", "ipfs", ipfs);
    this.registerIpfsHelp();
  }

  async registerIpfsHelp() {
    await this.events.request2('console:register:helpCmd', {
      cmdName: "ipfs",
      cmdHelp: __("instantiated js-ipfs object configured to the current environment (available if ipfs is enabled)")
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

  registerServiceCheck() {
    this.events.on('check:backOnline:IPFS', () => {
      this.logger.info(__('IPFS node detected') + '...');
    });

    this.events.on('check:wentOffline:IPFS', () => {
      this.logger.info(__('IPFS node is offline') + '...');
    });

    this.events.request("services:register", 'IPFS', (cb) => {
      this._checkService((err, body) => {
        if (err) {
          this.logger.trace("IPFS unavailable");
          return cb({name: "IPFS ", status: 'off'});
        }
        if (body.Version) {
          this.logger.trace("IPFS available");
          return cb({name: ("IPFS " + body.Version), status: 'on'});
        }
        this.logger.trace("IPFS available");
        return cb({name: "IPFS ", status: 'on'});
      });
    });
  }

  _getNodeUrl() {
    return buildUrlFromConfig(this._getNodeUrlConfig()) + '/api/v0/version';
  }

  _checkService(cb) {
    let url = this._getNodeUrl();
    getJson(url, cb);
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
        console.dir("--- launchProcess callback")
        console.dir(err)
        callback(err, true);
      });
    });
  }

  stopProcess(cb) {
    if(!this.storageProcessesLauncher) return cb();
    this.storageProcessesLauncher.stopProcess("ipfs", cb);
  }

}

module.exports = IPFS;
