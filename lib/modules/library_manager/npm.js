const fs = require('../../core/fs.js');
const PluginManager = require('live-plugin-manager-git-fix').PluginManager;
require('colors');
const NpmTimer = require('./npmTimer.js');

class Npm {

  constructor(options) {
    this._logger = options.logger;
    this._packageName = options.packageName;
    this._version = options.version;
    this._installing = {};
  }

  static getPackagePath(packageName, version){
    return './.embark/versions/' + packageName + '/' + version + '/' + packageName;
  }

  _isInstalling(packageName, version){
    return typeof this._installing[packageName + version] !== 'undefined';
  }

  getPackageVersion(packageName, version, callback) {
    const packagePath = Npm.getPackagePath(packageName, version);

    // check if this package already exists in the filesystem
    if (fs.existsSync(packagePath)) {
      return callback(null, packagePath);
    }

    const pluginManager = new PluginManager({pluginsPath: './.embark/versions/' + packageName + '/' + version + '/'});
    
    // check if we're already installing this package
    if(this._isInstalling(packageName, version)){
      this._installing[packageName + version].push(callback);
    }else{
      this._installing[packageName + version] = [callback];
      
      const timer = new NpmTimer({logger: this._logger, packageName: packageName, version: version});
      timer.start();

      // do the package download/install
      pluginManager.install(packageName, version).then((result) => {        
          timer.end();
          this._installing[packageName + version].forEach((cb) => {
            cb(null, result.location);
          });
          delete this._installing[packageName + version];
      }).catch(err => {
        this._installing[packageName + version].forEach((cb) => {
          cb(err);
        });
      });
    }
  }
}

module.exports = Npm;
