let UploadIPFS = require('./upload.js');
let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = options.storageConfig;
    this.host = options.host || this.storageConfig.host;
    this.port = options.port || this.storageConfig.port;
    this.addCheck = options.addCheck;
    this.embark = embark;

    this.commandlineDeploy();
    this.setServiceCheck();
    this.addIPFSToEmbarkJS();
    this.addSetProvider();
  }

  commandlineDeploy() {
    let upload_ipfs = new UploadIPFS({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig,
      configIpfsBin: this.storageConfig.ipfs_bin || "ipfs"
    });

    this.embark.registerUploadCommand('ipfs', upload_ipfs.deploy.bind(upload_ipfs));
  }

  setServiceCheck() {
    let self = this;

    let storageConfig = this.storageConfig;

    if (!storageConfig.enabled) {
      return;
    }
    if (storageConfig.provider !== 'ipfs' && storageConfig.available_providers.indexOf("ipfs") < 0) {
      return;
    }

    self.events.on('check:backOnline:IPFS', function () {
      self.logger.info('IPFS node detected..');
    });

    self.events.on('check:wentOffline:IPFS', function () {
      self.logger.info('IPFS node is offline..');
    });

    if (!self.addCheck) {
      return;
    }

    self.addCheck('IPFS', function (cb) {
      self.logger.trace("Checking IPFS version...");
      utils.httpGetJson('http://' + self.host + ':' + self.port + '/api/v0/version', function (err, body) {
        if (err) {
          self.logger.trace("Check IPFS version error: " + err);
          return cb({name: "IPFS ", status: 'off'});
        }
        if (body.Version) {
          return cb({name: ("IPFS " + body.Version), status: 'on'});
        }
        return cb({name: "IPFS ", status: 'on'});
      });
    });
  }

  addIPFSToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.storageConfig === {}) {
      return;
    }

    if ((this.storageConfig.available_providers.indexOf('ipfs') < 0) && (this.storageConfig.provider !== 'ipfs' || this.storageConfig.enabled !== true)) {
      return;
    }

    self.events.request("version:get:ipfs-api", function(ipfsApiVersion) {
      let currentIpfsApiVersion = require('../../../package.json').dependencies["ipfs-api"];
      if (ipfsApiVersion !== currentIpfsApiVersion) {
        self.events.request("version:getPackageLocation", "ipfs-api", ipfsApiVersion, function(err, location) {
          self.embark.registerImportFile("ipfs-api", fs.dappPath(location));
        });
      }
    });

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  addSetProvider() {
    let config = JSON.stringify({
      server: this.storageConfig.host,
      port: this.storageConfig.port,
      protocol: this.storageConfig.protocol,
      getUrl: this.storageConfig.getUrl
    });
    let code = "\nEmbarkJS.Storage.setProvider('ipfs'," + config + ");";

    let shouldInit = (storageConfig) => {
      return (storageConfig.provider === 'ipfs' && storageConfig.enabled === true);
    };

    this.embark.addProviderInit('storage', code, shouldInit);
  }
}

module.exports = IPFS;
