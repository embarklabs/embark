const UploadSwarm = require('./upload.js');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const Web3Bzz = require('web3-bzz');
const _ = require('underscore');
const StorageProcessesLauncher = require('../../processes/storageProcesses/storageProcessesLauncher');

class Swarm {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = embark.config.storageConfig;
    this.host = options.host || this.storageConfig.host;
    this.port = options.port || this.storageConfig.port;
    this.embark = embark;

    this.webServerConfig = embark.config.webServerConfig,
    this.blockchainConfig = embark.config.blockchainConfig

    this.providerUrl = utils.buildUrl(options.protocol || options.storageConfig.upload.protocol, options.host || options.storageConfig.upload.host, options.port || options.storageConfig.upload.port);

    this.getUrl = options.storageConfig.upload.getUrl || this.providerUrl + '/bzz:/';

    this.bzz = new Web3Bzz(this.providerUrl);

    this.commandlineDeploy();
    this.setServiceCheck();
    this.addProviderToEmbarkJS();
    this.startProcess(() => {});

    this._checkService((err) => {
      if (!err) {
        return;
      }
      self.logger.info("Swarm node not found, attempting to start own node");
      self.startProcess(() => {});
    });
  }

  commandlineDeploy() {
    this.upload_swarm = new UploadSwarm({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig,
      getUrl: this.getUrl,
      bzz: this.bzz
    });

    this.events.setCommandHandler('storage:upload:swarm', this.upload_swarm.deploy.bind(this.upload_swarm));
  }

  setServiceCheck() {
    let self = this;

    let storageConfig = this.storageConfig;

    if (!storageConfig.enabled) {
      return;
    }
    if (_.findWhere(this.storageConfig.dappConnection, {'provider': 'swarm'}) === undefined && (storageConfig.upload.provider !== 'swarm' || storageConfig.available_providers.indexOf("swarm") < 0)) {
      return;
    }

    this.events.on('check:backOnline:Swarm', function () {
      self.logger.info(__('Swarm node detected...'));
    });

    this.events.on('check:wentOffline:Swarm', function () {
      self.logger.info(__('Swarm node is offline...'));
    });

    self.events.request("services:register", 'Swarm', function(cb){
      self.logger.trace(`Checking Swarm availability on ${self.bzz.currentProvider}...`);
      self._checkService((err, result) => {
        if (err) {
          self.logger.trace("Check Swarm availability error: " + err);
          return cb({name: "Swarm ", status: 'off'});
        }
        self.logger.trace("Swarm " + (result ? '':'on') + "available");
        return cb({name: "Swarm ", status: result ? 'on':'off'});
      });
    });
  }

  _checkService(cb) {
    this.bzz.isAvailable().then(result => {
      cb(null, result);
    }).catch(cb);
  }

  addProviderToEmbarkJS() {
    // TODO: make this a shouldAdd condition
    if (this.storageConfig === {}) {
      return;
    }

    if (this.storageConfig.available_providers.indexOf('swarm') < 0 || _.findWhere(this.storageConfig.dappConnection, {'provider': 'swarm'}) === undefined || this.storageConfig.enabled !== true) {
      return;
    }

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('swarm', __embarkSwarm);";

    this.embark.addCodeToEmbarkJS(code);
  }

  startProcess(callback) {
    let self = this;
    const storageProcessesLauncher = new StorageProcessesLauncher({
      logger: self.logger,
      events: self.events,
      storageConfig: self.storageConfig,
      webServerConfig: self.webServerConfig,
      blockchainConfig: self.blockchainConfig
    });
    self.logger.trace(`Storage module: Launching swarm process...`);
    return storageProcessesLauncher.launchProcess('swarm', (err) => {
      if (err) {
        return callback(err);
      }
      callback();
    });
  }

}

module.exports = Swarm;

