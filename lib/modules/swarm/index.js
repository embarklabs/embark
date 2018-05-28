const UploadSwarm = require('./upload.js');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const Web3Bzz = require('web3-bzz');

class Swarm {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = options.storageConfig;
    this.host = options.host || options.storageConfig.upload.host;
    this.port = options.port || options.storageConfig.upload.port;
    this.protocol = options.protocol || options.storageConfig.upload.protocol;
    this.addCheck = options.addCheck;
    this.embark = embark;
    this.bzz = options.bzz;

    // this.initProvider();
    // this.commandlineDeploy();
    // this.setServiceCheck();
    // this.addProviderToEmbarkJS();
    // this.addSetProvider();
  }

  initProvider(){
    if(!this.bzz.currentProvider) {
      this.bzz.setProvider(`${this.protocol}://${this.host}:${this.port}`);
    }
  }

  commandlineDeploy() {
    this.upload_swarm = new UploadSwarm({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig,
      connectUrl: this.providerUrl,
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
    if (storageConfig.upload.provider !== 'swarm' || storageConfig.available_providers.indexOf("swarm") < 0) {
      return;
    }

    this.events.on('check:backOnline:Swarm', function () {
      self.logger.info(__('Swarm node detected...'));
    });

    this.events.on('check:wentOffline:Swarm', function () {
      self.logger.info(__('Swarm node is offline...'));
    });

    if (!this.addCheck) {
      return;
    }

    // add check for console
    this.addCheck('Swarm', function(cb){
      self.logger.trace("Checking Swarm availability...");
      self.bzz.isAvailable().then(result => {
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

    if (this.storageConfig.available_providers.indexOf('swarm') < 0 || this.storageConfig.enabled !== true) {
      return;
    }

    this.events.request("version:get:p-iteration", function(pIterationVersion) {
      let currentPIterationVersion = require('../../../package.json').dependencies["p-iteration"];
      if (pIterationVersion !== currentPIterationVersion) {
        self.events.request("version:getPackageLocation", "p-iteration", pIterationVersion, function(err, location) {
          self.embark.registerImportFile("p-iteration", fs.dappPath(location));
        });
      }
    });

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('swarm', __embarkSwarm);";

    this.embark.addCodeToEmbarkJS(code);
  }

  // addSetProvider() {
  //   let code = "\nEmbarkJS.Storage.setProviders('swarm'," + JSON.stringify(this.storageConfig.dappConnection) + ");";

  //   let shouldInit = (storageConfig) => {
  //     return (this.storageConfig.dappConnection !== undefined && this.storageConfig.dappConnection.some((dappConn) => dappConn.provider === 'swarm') && storageConfig.enabled === true);
  //   };

  //   this.embark.addProviderInit('storage', code, shouldInit);
  // }
}

module.exports = Swarm;

