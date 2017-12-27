let UploadSwarm = require('./upload.js');

class Swarm {

  constructor(embark, options) {
    this.logger = embark.logger;

    this.upload_swarm = new UploadSwarm({
      buildDir: options.buildDir || 'dist/',
      storageConfig: options.storageConfig
    });

    embark.registerUploadCommand('swarm', this.upload_swarm.deploy.bind(this.upload_swarm));
  }

}

module.exports = Swarm;

