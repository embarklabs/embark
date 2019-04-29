const UploadIPFS = require('./upload.js');
const utils = require('../../utils/utils.js');
const IpfsApi = require('ipfs-api');
// TODO: not great, breaks module isolation
const StorageProcessesLauncher = require('../storage/storageProcessesLauncher');
const constants = require('embark-core/constants');

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embarkConfig = embark.config.embarkConfig;
    this.storageConfig = embark.config.storageConfig;
    this.namesystemConfig = embark.config.namesystemConfig;
    this.embark = embark;
    this.fs = embark.fs;

    this.webServerConfig = embark.config.webServerConfig;
    this.blockchainConfig = embark.config.blockchainConfig;

    if (!this.isIpfsStorageEnabledInTheConfig()) {
      return this.events.emit("ipfs:process:started", null, false);
    }

    this.setServiceCheck();
    this.registerUploadCommand();
    this.listenToCommands();
    this.registerConsoleCommands();
    this.startProcess((err, newProcessStarted) => {
      this.addStorageProviderToEmbarkJS();
      this.addObjectToConsole();
      this.events.emit("ipfs:process:started", err, newProcessStarted);
    });
  }

  downloadIpfsApi(cb) {
    this.events.request("version:get:ipfs-api", (ipfsApiVersion) => {
      let currentIpfsApiVersion = require('../../../../package.json').dependencies["ipfs-api"];
      if (ipfsApiVersion === currentIpfsApiVersion) {
        const nodePath = this.fs.embarkPath('node_modules');
        const ipfsPath = require.resolve("ipfs-api", {paths: [nodePath]});
        return cb(null, ipfsPath);
      }
      this.events.request("version:getPackageLocation", "ipfs-api", ipfsApiVersion, (err, location) => {
        cb(err, this.fs.dappPath(location));
      });
    });
  }

  setServiceCheck() {
    let self = this;

    self.events.on('check:backOnline:IPFS', function () {
      self.logger.info(__('IPFS node detected') + '..');
    });

    self.events.on('check:wentOffline:IPFS', function () {
      self.logger.info(__('IPFS node is offline') + '..');
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
    if (this.storageConfig.upload.provider === 'ipfs') {
      return this.storageConfig.upload;
    }

    for (let connection of this.storageConfig.dappConnection) {
      if (connection.provider === 'ipfs') {
        return connection;
      }
    }
  }

  _getNodeUrl() {
    return utils.buildUrlFromConfig(this._getNodeUrlConfig()) + '/api/v0/version';
  }

  _checkService(cb) {
    let url = this._getNodeUrl();
    utils.getJson(url, cb);
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
            let code = "";
            code += "\nconst __embarkIPFS = require('embarkjs-ipfs')";
            code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS.default || __embarkIPFS);";

            this.embark.addCodeToEmbarkJS(code);
            this.embark.addConsoleProviderInit("storage", code, (storageConfig) => storageConfig.enabled);
          });
        });
      });
    });
  }

  addObjectToConsole() {
    const {host, port} = this._getNodeUrlConfig();
    let ipfs = IpfsApi(host, port);
    this.events.emit("runcode:register", "ipfs", ipfs);
  }

  startProcess(callback) {
    this._checkService((err) => {
      if (!err) {
        this.logger.info("IPFS node found, using currently running node");
        return callback(null, false);
      }
      this.logger.info("IPFS node not found, attempting to start own node");
      let self = this;
      const storageProcessesLauncher = new StorageProcessesLauncher({
        logger: self.logger,
        events: self.events,
        storageConfig: self.storageConfig,
        webServerConfig: self.webServerConfig,
        blockchainConfig: self.blockchainConfig,
        corsParts: self.embark.config.corsParts,
        embark: self.embark
      });
      self.logger.trace(`Storage module: Launching ipfs process...`);
      return storageProcessesLauncher.launchProcess('ipfs', (err) => {
        callback(err, true);
      });
    });
  }

  registerUploadCommand() {
    const self = this;
    this.embark.registerUploadCommand('ipfs', (cb) => {
      let upload_ipfs = new UploadIPFS({
        buildDir: self.buildDir || 'dist/',
        storageConfig: self.storageConfig,
        configIpfsBin: self.storageConfig.ipfs_bin || "ipfs",
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
    let {enabled, available_providers, dappConnection, upload} = this.storageConfig;
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
