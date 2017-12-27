let UploadIPFS = require('./upload.js');

class IPFS {

  constructor(embark, options) {
    this.logger = embark.logger;

    this.upload_ipfs = new UploadIPFS({
      buildDir: options.buildDir || 'dist/',
      storageConfig: options.storageConfig,
      configIpfsBin: options.storageConfig.ipfs_bin || "ipfs"
    });

    embark.registerUploadCommand('ipfs', this.upload_ipfs.deploy.bind(this.upload_ipfs));
  }

}

module.exports = IPFS;
