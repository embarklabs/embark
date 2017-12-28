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

    let server = 'http://' + this.host + ':' + this.port;
    self.logger.info(server);

    this.addCheck('IPFS', function (cb) {
      utils.checkIsAvailable(server, function (available) {
        if (available) {
          //Ideally this method should be in an IPFS API JSONRPC wrapper
          //The URL should also be flexible to accept non-default IPFS url
          self.logger.trace("Checking IPFS version...");
          utils.httpGet(server + '/api/v0/version', function (err, body) {
            if (err) {
              self.logger.trace("Check IPFS version error: " + err);
              return cb({name: "IPFS ", status: 'off'});
            }
            try {
              let parsed = JSON.parse(body);
              if (parsed.Version) {
                return cb({name: ("IPFS " + parsed.Version), status: 'on'});
              }
              else {
                return cb({name: "IPFS ", status: 'on'});
              }
            }
            catch (e) {
              return cb({name: "IPFS ", status: 'off'});
            }
          });
        }
        else {
          return cb({name: "IPFS ", status: 'off'});
        }
      });
    });
  }

  addIPFSToEmbarkJS() {
    if (this.storageConfig === {}) {
      return;
    }
    if(this.storageConfig.provider !== 'ipfs' || this.storageConfig.enabled !== true) {
      return;
    }

    let code = "";
    code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    code += "\nEmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS);";

    this.embark.addCodeToEmbarkJS(code);
  }

  addSetProvider() {
    let config = JSON.stringify({
      server: this.storageConfig.host,
      port: this.storageConfig.port,
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
