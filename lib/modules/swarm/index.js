const UploadSwarm = require('./upload.js');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const Web3Bzz = require('web3-bzz');
const _ = require('underscore');

class Swarm {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = embark.config.storageConfig;
    this.host = options.host || this.storageConfig.host;
    this.port = options.port || this.storageConfig.port;
    this.embark = embark;

    this.providerUrl = utils.buildUrl(options.protocol || options.storageConfig.upload.protocol, options.host || options.storageConfig.upload.host, options.port || options.storageConfig.upload.port);

    this.getUrl = options.storageConfig.upload.getUrl || this.providerUrl + '/bzz:/';

    this.bzz = new Web3Bzz(this.providerUrl);
  }

  commandlineDeploy() {
    this.upload_swarm = new UploadSwarm({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig,
      getUrl: this.getUrl,
      bzz: this.bzz
    });

    this.embark.registerUploadCommand('swarm', this.upload_swarm.deploy.bind(this.upload_swarm));
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
      self.bzz.isAvailable().then(result => {
        self.logger.trace("Swarm " + (result ? '':'un') + "available");
        return cb({name: "Swarm ", status: result ? 'on':'off'});
      }).catch(err => {
        self.logger.trace("Check Swarm availability error: " + err);
        return cb({name: "Swarm ", status: 'off'});
      }); 
    });
  }

  addProviderToEmbarkJS() {
    let self = this;
    // TODO: make this a shouldAdd condition
    if (this.storageConfig === {}) {
      return;
    }

    if (this.storageConfig.available_providers.indexOf('swarm') < 0 || _.findWhere(this.storageConfig.dappConnection, {'provider': 'swarm'}) === undefined || this.storageConfig.enabled !== true) {
      return;
    }

    this.events.request("version:get:p-iteration", function(pIterationVersion) {
      let currentPIterationVersion = require('../../../package.json').dependencies["p-iteration"];
      if (pIterationVersion !== currentPIterationVersion) {
        self.events.request("version:getPackageLocation", "p-iteration", pIterationVersion, function(err, location) {
          if(!err){
            self.embark.registerImportFile("p-iteration", fs.dappPath(location));
          }
          else{
            self.logger.error("Error getting package location for p-iteration: " + err);
          }
        });
      }
    });

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('swarm', __embarkSwarm);";

    this.embark.addCodeToEmbarkJS(code);
  }
}

module.exports = Swarm;

