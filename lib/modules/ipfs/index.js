const UploadIPFS = require('./upload.js');
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const IpfsApi = require('ipfs-api');
const _ = require('underscore');

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.storageConfig = embark.config.storageConfig;
    this.host = options.host || this.storageConfig.upload.host;
    this.port = options.port || this.storageConfig.upload.port;
    this.protocol = options.protocol || this.storageConfig.upload.protocol;
    this.embark = embark;
  }

  commandlineDeploy() {
    let upload_ipfs = new UploadIPFS({
      buildDir: this.buildDir || 'dist/',
      storageConfig: this.storageConfig.upload,
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
    if (_.findWhere(this.storageConfig.dappConnection, {'provider': 'ipfs'}) === undefined && (storageConfig.upload.provider !== 'ipfs' || storageConfig.available_providers.indexOf("ipfs") < 0)) {
      return;
    }

    self.events.on('check:backOnline:IPFS', function () {
      self.logger.info(__('IPFS node detected') + '..');
    });

    self.events.on('check:wentOffline:IPFS', function () {
      self.logger.info(__('IPFS node is offline') + '..');
    });

    self.events.request("services:register", 'IPFS', function (cb) {
      let url = (self.protocol || 'http') + '://' + self.host + ':' + self.port + '/api/v0/version';
      self.logger.trace(`Checking IPFS version on ${url}...`);
      if(self.protocol !== 'https'){
        utils.httpGetJson(url, versionCb);
      } else {
        utils.httpsGetJson(url, versionCb);
      }
      function versionCb(err, body) {
        if (err) {
          self.logger.trace("Check IPFS version error: " + err);
          return cb({name: "IPFS ", status: 'off'});
        }
        if (body.Version) {
          self.logger.trace("IPFS available");
          return cb({name: ("IPFS " + body.Version), status: 'on'});
        }
        self.logger.trace("IPFS available");
        return cb({name: "IPFS ", status: 'on'});
      }
    });
  }

  addProviderToEmbarkJS() {
    const self = this;
    // TODO: make this a shouldAdd condition
    if (this.storageConfig === {}) {
      return;
    }

    if (this.storageConfig.available_providers.indexOf('ipfs') < 0 || _.findWhere(this.storageConfig.dappConnection, {'provider': 'ipfs'}) === undefined || this.storageConfig.enabled !== true) {
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

    self.events.request("version:get:p-iteration", function(pIterationVersion) {
      let currentPIterationVersion = require('../../../package.json').dependencies["p-iteration"];
      if (pIterationVersion !== currentPIterationVersion) {
        self.events.request("version:getPackageLocation", "p-iteration", pIterationVersion, function(err, location) {
          self.embark.registerImportFile("p-iteration", fs.dappPath(location));
        });
      }
    });

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  addObjectToConsole() {
    let ipfs = IpfsApi(this.host, this.port);
    this.events.emit("runcode:register", "ipfs", ipfs);
  }

}

module.exports = IPFS;
