let UploadSwarm = require('./upload.js');
let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');

class Swarm {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = options.storageConfig;
    this.host = options.host || this.storageConfig.host;
    this.port = options.port || this.storageConfig.port;
    this.addCheck = options.addCheck;
    this.embark = embark;
    this.bzz = options.bzz;

    this.initSwarmProvider();
    this.commandlineDeploy();
    this.setServiceCheck();
    this.addSwarmToEmbarkJS();
    this.addSetProvider();
  }

  initSwarmProvider(){
    if(!this.bzz.currentProvider) {
      this.bzz.setProvider(`http://${this.host}:${this.port}`);
    }
  }

  commandlineDeploy() {
    this.upload_swarm = new UploadSwarm({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig,
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
    if (storageConfig.provider !== 'swarm' && storageConfig.available_providers.indexOf("swarm") < 0) {
      return;
    }

    this.events.on('check:backOnline:Swarm', function () {
      self.logger.info('Swarm node detected...');
    });

    this.events.on('check:wentOffline:Swarm', function () {
      self.logger.info('Swarm node is offline...');
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

  addSwarmToEmbarkJS() {
    // TODO: make this a shouldAdd condition
    if (this.storageConfig === {}) {
      return;
    }

    if ((this.storageConfig.available_providers.indexOf('swarm') < 0) && (this.storageConfig.provider !== 'swarm' || this.storageConfig.enabled !== true)) {
      return;
    }

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('swarm', __embarkSwarm);";

    this.embark.addCodeToEmbarkJS(code);
  }

  addSetProvider() {
    let config = JSON.stringify({
      host: this.storageConfig.host,
      port: this.storageConfig.port,
      protocol: this.storageConfig.protocol,
      getUrl: this.storageConfig.getUrl
    });
    let code = "\nEmbarkJS.Storage.setProvider('swarm'," + config + ");";

    let shouldInit = (storageConfig) => {
      return (storageConfig.provider === 'swarm' && storageConfig.enabled === true);
    };

    this.embark.addProviderInit('storage', code, shouldInit);
  }
}

module.exports = Swarm;

