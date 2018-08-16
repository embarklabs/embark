const UploadSwarm = require('./upload.js');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const SwarmGW = require('swarmgw');
// TODO: not great, breaks module isolation
const StorageProcessesLauncher = require('../storage/storageProcessesLauncher');

class Swarm {

  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = embark.config.buildDir;
    this.storageConfig = embark.config.storageConfig;
    this.host = this.storageConfig.host;
    this.port = this.storageConfig.port;
    this.embark = embark;

    this.webServerConfig = embark.config.webServerConfig;
    this.blockchainConfig = embark.config.blockchainConfig;

    this.providerUrl = utils.buildUrl(this.storageConfig.upload.protocol, this.storageConfig.upload.host, this.storageConfig.upload.port);

    this.getUrl = this.storageConfig.upload.getUrl || this.providerUrl + '/bzz:/';

    if (!this.isSwarmEnabledInTheConfig()) {
      return;
    }
    this.swarm = new SwarmGW({gateway: this.providerUrl});

    this.setServiceCheck();
    this.addProviderToEmbarkJS();
    // TODO add check to see if we need to start process
    this.startProcess(() => {});
    this.registerUploadCommand();

    this._checkService((err) => {
      if (!err) {
        return;
      }
      self.logger.info("Swarm node not found, attempting to start own node");
      self.startProcess(() => {});
    });
  }

  setServiceCheck() {
    let self = this;

    this.events.on('check:backOnline:Swarm', function () {
      self.logger.info(__('Swarm node detected...'));
    });

    this.events.on('check:wentOffline:Swarm', function () {
      self.logger.info(__('Swarm node is offline...'));
    });

    self.events.request("services:register", 'Swarm', function(cb){
      self.logger.trace(`Checking Swarm availability on ${self.providerUrl}...`);
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
    this.swarm.isAvailable(cb);
  }

  addProviderToEmbarkJS() {
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
    return storageProcessesLauncher.launchProcess('swarm', callback);
  }

  registerUploadCommand() {
    const self = this;
    this.embark.registerUploadCommand('swarm', (cb) => {
      let upload_swarm = new UploadSwarm({
        buildDir: self.buildDir || 'dist/',
        storageConfig: self.storageConfig,
        getUrl: self.getUrl,
        swarm: self.swarm
      });

      upload_swarm.deploy(cb);
    });
  }

  isSwarmEnabledInTheConfig() {
    let {enabled, available_providers, dappConnection} = this.storageConfig;
    return enabled && (available_providers.indexOf('swarm') > 0 || dappConnection.find(c => c.provider === 'swarm'));
  }

}

module.exports = Swarm;
