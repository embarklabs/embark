const path = require('path');
require('colors');
import { LongRunningProcessTimer } from 'embark-utils';
const {exec} = require('child_process');
const {existsSync, mkdirpSync, writeFileSync} = require('fs-extra');
const rimraf = require('rimraf');

const FINISHED_INSTALLING_SUCCESSFULLY = 'finished';

class Npm {

  constructor(options) {
    this._logger = options.logger;
    this._packageName = options.packageName;
    this._version = options.version;
    this._installed = {};
    this._installing = {};
    this._installFailed = {};
    this._useDashboard = options.useDashboard;
  }

  static getPackagePath(packageName, version) {
    return path.join('.embark', 'versions', packageName, version, 'node_modules', packageName);
  }

  _isInstallFailure(packageName, version) {
    return !!this._installFailed[packageName + version];
  }

  _isInstalled(packageName, version) {
    if (this._installed[packageName + version]) {
      return true;
    }
    const packagePath = Npm.getPackagePath(packageName, version);
    const installPath = path.dirname(path.dirname(packagePath));
    if (existsSync(packagePath) &&
        !this._isInstalling(packageName, version)) {
      if (existsSync(path.join(installPath, FINISHED_INSTALLING_SUCCESSFULLY))) {
        this._installed[packageName + version] = true;
        return true;
      }
      rimraf.sync(installPath);
      return false;
    }
    return false;
  }

  _isInstalling(packageName, version) {
    return !!this._installing[packageName + version];
  }

  getPackageVersion(packageName, version, callback) {
    const packagePath = Npm.getPackagePath(packageName, version);

    // check if this package is already installed
    if (this._isInstalled(packageName, version)) {
      return callback(null, packagePath);
    }

    // check if this package already failed to install
    if (this._isInstallFailure(packageName, version)) {
      return callback(this._installFailed[packageName + version]);
    }

    // check if we're already installing this package
    if (this._isInstalling(packageName, version)) {
      this._installing[packageName + version].push(callback);
    } else {
      this._installing[packageName + version] = [callback];

      const timer = new LongRunningProcessTimer(
        this._logger,
        packageName,
        version,
        'Downloading and installing {{packageName}} {{version}}...\n',
        'Still downloading and installing {{packageName}} {{version}}... ({{duration}})\n',
        'Finished downloading and installing {{packageName}} {{version}} in {{duration}}\n',
        {
          showSpinner: !this._useDashboard,
          interval: this._useDashboard ? 2000 : 1000,
          longRunningThreshold: 120000
        }
      );
      timer.start();

      // do the package install
      const installPath = path.dirname(path.dirname(packagePath));
      mkdirpSync(installPath);
      exec(`npm init -y && npm install --no-package-lock --no-save ${packageName}@${version}`, {
        cwd: installPath
      }, (err) => {
        this._installing[packageName + version].forEach(cb => {
          setImmediate(() => { return err ? cb(err) : cb(null, packagePath); });
        });
        delete this._installing[packageName + version];

        if (err) {
          timer.abort();
          this._installFailed[packageName + version] = err;
          rimraf.sync(installPath);
        } else {
          timer.end();
          this._installed[packageName + version] = true;
          writeFileSync(path.join(installPath, FINISHED_INSTALLING_SUCCESSFULLY), '');
        }
      });
    }
  }
}

module.exports = Npm;
