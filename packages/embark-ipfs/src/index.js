import {__} from 'embark-i18n';
const IpfsApi = require('ipfs-api');
const StorageProcessesLauncher = require('./storageProcessesLauncher.js');
import {buildUrlFromConfig, getJson} from 'embark-utils';
const UploadIPFS = require('./upload.js');
const constants = require('embark-core/constants');

require('ejs');

class IPFS {

  constructor(embark) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.logger = embark.logger;
    this.embarkConfig = embark.config.embarkConfig;
    this.storageConfig = embark.config.storageConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.webServerConfig = embark.config.webServerConfig;
    this.embark = embark;
    this.fs = embark.fs;
    this.storageProcessesLauncher = null;
    this._config = null; // backing variable for config property
    this._enabled = null; // backing variable for enabled property

    if (this.enabled && this.config === {}) {
      console.warn('\n===== IPFS module will not be loaded =====');
      console.warn(`IPFS is enabled in the config, however the config is not setup to provide a URL for IPFS and therefore the IPFS module will not be loaded. Please either change the ${'config/storage > upload'.bold} setting to IPFS or add the IPFS config to the ${'config/storage > dappConnection'.bold} array. Please see ${'https://embark.status.im/docs/storage_configuration.html'.underline} for more information.\n`);
      return;
    }
    if (!this.enabled) {
      this.embark.registerConsoleCommand({
        matches: cmd => cmd === "ipfs" || cmd.indexOf('ipfs ') === 0,
        process: (_cmd, cb) => {
          console.warn(__(`IPFS is disabled or not configured. Please see %s for more information.`, 'https://embark.status.im/docs/storage_configuration.html'.underline));
          cb();
        }
      });
      return;
    }

    this.events.request("runcode:whitelist", 'ipfs-api', () => {});
    this.events.request("runcode:whitelist", 'embarkjs', () => {});
    this.events.request("runcode:whitelist", 'embarkjs-ipfs', () => {});
    this.events.on("storage:started", this.registerIpfsObject.bind(this));
    this.events.on("storage:started", this.connectEmbarkJSProvider.bind(this));

    this.embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSIpfsArtifact.bind(this));

    this.events.request("storage:node:register", "ipfs", (readyCb) => {
      this.events.request('processes:register', 'storage', {
        launchFn: (cb) => {
          this.startProcess(cb);
        },
        stopFn: (cb) => {
          this.stopProcess(cb);
        }
      });
      this.events.request("processes:launch", "storage", (err) => {
        readyCb(err);
      });
      this.registerServiceCheck();
    });

    this.events.request("storage:upload:register", "ipfs", (readyCb) => {
      let upload_ipfs = new UploadIPFS({
        buildDir: this.buildDir || 'dist/',
        storageConfig: this.storageConfig,
        configIpfsBin: this.storageConfig.ipfs_bin || "ipfs",
        env: this.embark.env
      });

      upload_ipfs.deploy(readyCb);
    });

    this.registerEmbarkJSStorage();
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
    this._config = dappConnection.find(c => c.provider === 'ipfs') || {};
    return this._config;
  }

  get enabled() {

    if (this._enabled !== null) {
      return this._enabled;
    }

    let {enabled, available_providers, dappConnection, upload} = this.storageConfig;
    this._enabled = (enabled || this.embark.currentContext.includes(constants.contexts.upload)) &&
      available_providers.includes('ipfs') &&
      (
        dappConnection.some(c => c.provider === 'ipfs') ||
        upload.provider === "ipfs"
      );

    return this._enabled;
  }

  async addEmbarkJSIpfsArtifact(params, cb) {
    const code = `
      var EmbarkJS;
      if (typeof EmbarkJS === 'undefined') {
        EmbarkJS = require('embarkjs');
      }
      const __embarkIPFS = require('embarkjs-ipfs');
      EmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS.default || __embarkIPFS);
      EmbarkJS.Storage.setProviders(${JSON.stringify(this.embark.config.storageConfig.dappConnection || [])}, {web3});
    `;
    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'storage'],
      file: 'init.js',
      format: 'js',
      content: code
    }, cb);
  }

  async registerIpfsObject() {
    const {host, port} = this.config;
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

  async registerEmbarkJSStorage() {
    let checkEmbarkJS = `
      return (typeof EmbarkJS === 'undefined');
    `;
    let EmbarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (EmbarkJSNotDefined) {
      await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
    }

    const registerProviderCode = `
      const __embarkIPFS = require('embarkjs-ipfs');
      EmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS.default || __embarkIPFS);
    `;

    await this.events.request2('runcode:eval', registerProviderCode);
  }

  async connectEmbarkJSProvider() {
    let providerCode = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.embark.config.storageConfig.dappConnection || [])}, {web3});`;
    await this.events.request2('runcode:eval', providerCode);
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
    return buildUrlFromConfig(this.config) + '/api/v0/version';
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
      if (this.storageProcessesLauncher === null) {
        this.storageProcessesLauncher = new StorageProcessesLauncher({
          logger: self.logger,
          events: self.events,
          storageConfig: self.storageConfig,
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
    if (!this.storageProcessesLauncher) return cb();
    this.storageProcessesLauncher.stopProcess("ipfs", cb);
  }

}

module.exports = IPFS;
