import { __ } from 'embark-i18n';
import { dappPath, embarkPath, normalizePath, toForwardSlashes } from 'embark-utils';
import web3 from 'web3';
const Npm = require('./npm.js');
const {callbackify} = require('util');

class LibraryManager {

  constructor(embark, {useDashboard}) {
    this.embark = embark;
    this.config = embark.config;
    this.contractsConfig = this.config.contractsConfig;
    this.storageConfig = this.config.storageConfig;
    this.useDashboard = useDashboard;
    this.npm = new Npm({logger: this.embark.logger, useDashboard});

    this.determineVersions();

    this.registerCommands();
    this.registerAPICommands();
    this.listenToCommandsToGetVersions();
    this.listenToCommandsToGetLibrary();
  }

  determineVersions() {
    let unversionable = [];
    Object.keys(this.config.embarkConfig.versions).forEach(pkgName => {
      if (!this.isVersionable(pkgName)) unversionable.push(pkgName);
    });

    if (unversionable.length) {
      const plural = unversionable.length > 1;
      if (plural) {
        const last = unversionable.pop();
        const count = unversionable.length;
        unversionable = unversionable.join(', ') + `${count > 1 ? ',' : ''} and ${last}`;
      } else {
        unversionable = unversionable[0];
      }
      this.embark.logger.warn(`package${plural ? 's' : ''} ${unversionable} ${plural ? 'are' : 'is'} not versionable, please remove ${plural ? 'them' : 'it'} from this project's embark.json`);
    }

    this.versions = {};

    let solcVersionInConfig = this.contractsConfig.versions["solc"];

    this.versions['solc'] = solcVersionInConfig;

    this.versions.web3 = web3.version;

    Object.keys(this.versions).forEach(versionKey => {
      if (!this.isVersionable(versionKey)) return;
      const newVersion = this.versions[versionKey].trim();
      if (newVersion !== this.versions[versionKey]) {
        this.embark.logger.warn(__('There is a space in the version of {{versionKey}}. We corrected it for you ({{correction}}).', {versionKey: versionKey, correction: `"${this.versions[versionKey]}" => "${newVersion}"`}));
        this.versions[versionKey] = newVersion;
      }
    });
  }

  static versionablePkgs = new Set(['solc']);

  isVersionable(name) {
    return LibraryManager.versionablePkgs.has(name);
  }

  installAll(callback) {
    const installAll = async () => {
      const useDashboard = this.npm._useDashboard;
      this.npm._useDashboard = false;

      const results = await Promise.all(
        Object.entries(this.versions)
          .filter(([packageName, version]) => {
            if (!this.isVersionable(packageName)) return false;
            // NOTE: will behave less than ideally if embark switches to using
            // a dependency range for the various overridable packages instead
            // of an exact version
            if (version === this.embark.config.package.dependencies[packageName]) {
              return false;
            }
            return true;
          })
          .map(
            ([packageName, version]) => {
              return new Promise((resolve) => {
                this.npm.getPackageVersion(packageName, version, (err, location) => {
                  resolve({packageName, version, err, location});
                });
              });
            }
          )
      );

      this.npm._useDashboard = useDashboard;

      const errors = {};
      const locations = {};

      results.forEach(({packageName, version, err, location}) => {
        if (err) {
          errors[packageName] = {version, err};
        } else {
          locations[packageName] = {version, location};
        }
      });

      if (!Object.keys(errors).length) return locations;

      const packages = (Object.entries(errors).reduce((packages, [packageName, {version}]) => {
        return packages.concat(`${packageName}@${version}`);
      }, []));

      const err = new Error(`install failed for ${packages.length} packages: ${packages.join(', ')}`);
      err.results = {errors, locations};
      throw err;
    };

    if (callback) {
      return callbackify(installAll)(callback);
    }
    return installAll();
  }

  registerCommands() {
    const self = this;
    const matches = ['versions'];
    if (__('versions') !== matches[0]) {
      matches.push(__('versions'));
    }
    this.embark.registerConsoleCommand({
      matches,
      description: __("display versions in use for libraries and tools like solc"),
      process: (cmd, callback) => {
        let text = [__('versions in use') + ':'];
        for (let lib in self.versions) {
          text.push(lib + ": " + self.versions[lib]);
        }
        callback(null, text.join('\n'));
      }
    });
  }

  registerAPICommands() {
    const self = this;
    self.embark.registerAPICall(
      'get',
      '/embark-api/versions',
      (req, res) => {
        const versions = Object.keys(self.versions).map((name) => ({value: self.versions[name], name}));
        res.send(versions);
      }
    );
  }

  listenToCommandsToGetVersions() {
    const self = this;
    for (let libName in this.versions) {
      let lib = self.versions[libName];
      this.embark.events.setCommandHandler('version:get:' + libName, (cb) => {
        cb(lib);
      });
    }
  }

  downloadIfNeeded(packageName, cb) {
    const wantedVersion = this.versions[packageName];
    let installedVersion = this.embark.config.package.dependencies[packageName];
    if (!wantedVersion || wantedVersion === installedVersion) {
      const nodePath = embarkPath('node_modules');
      const packagePath = require.resolve(packageName, {paths: [nodePath]});
      return cb(null, normalizePath(packagePath, true));
    }
    // Download package
    this.embark.events.request("version:getPackageLocation", packageName, wantedVersion, (err, location) => {
      cb(err, toForwardSlashes(dappPath(location)));
    });
  }

  listenToCommandsToGetLibrary() {
    this.embark.events.setCommandHandler('version:getPackageLocation', (libName, version, cb) => {
      if (!this.isVersionable(libName)) {
        return cb(new Error(`package ${libName} is not versionable`));
      }
      this.npm.getPackageVersion(libName, version, cb);
    });
    this.embark.events.setCommandHandler('version:downloadIfNeeded', (libName, cb) => {
      this.downloadIfNeeded(libName, cb);
    });
    this.embark.events.setCommandHandler('version:getPackagePath', (libName, version, cb) => {
      cb(null, Npm.getPackagePath(libName, version));
    });
  }

}

module.exports = LibraryManager;
