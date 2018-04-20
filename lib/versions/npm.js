let utils = require('../utils/utils.js');
let fs = require('../core/fs.js');

let PluginManager = require('live-plugin-manager').PluginManager;

class Npm {

  constructor(options) {
    this.logger = options.logger;
  }

  getPackageVersion(packageName, version, callback) {
    let self = this;
    let npmRegistry = "https://registry.npmjs.org/" + packageName + "/" + version;
    let packageDirectory = './.embark/versions/' + packageName + '/' + version + '/';

    let manager = new PluginManager({pluginsPath: packageDirectory});

    if (fs.existsSync(packageDirectory + packageName)) {
      return callback(null, packageDirectory + packageName);
    }

    this.logger.info("downloading " + packageName + " " + version + "....");
    manager.install(packageName, version).then((result) => {
      callback(null , result.location);
    }).catch(callback);
  }
}

module.exports = Npm;
