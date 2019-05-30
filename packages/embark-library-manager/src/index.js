import { __ } from 'embark-i18n';
import { dappPath, embarkPath } from 'embark-utils';
var Npm = require('./npm.js');

const DEPRECATIONS = {
  'ipfs-api': 'ipfs-http-client'
};

class LibraryManager {

  constructor(embark, {useDashboard}) {
    this.embark = embark;
    this.logger = embark.logger;
    this.config = embark.config;
    this.contractsConfig = this.config.contractsConfig;
    this.storageConfig = this.config.storageConfig;
    this.useDashboard = useDashboard;

    this.determineVersions();

    this.registerCommands();
    this.registerAPICommands();
    this.listenToCommandsToGetVersions();
    this.listenToCommandsToGetLibrary();
  }

  determineVersions() {
    this.versions = {};

    let solcVersionInConfig = this.contractsConfig.versions.solc;
    let web3VersionInConfig = this.contractsConfig.versions["web3"];
    let ipfsHttpClientVersion = this.storageConfig.versions["ipfs-http-client"];

    this.versions['solc'] = solcVersionInConfig;
    this.versions['web3'] = web3VersionInConfig;
    this.versions['ipfs-http-client'] = ipfsHttpClientVersion;

    Object.keys(this.versions).forEach(versionKey => {
      const newVersion = this.versions[versionKey].trim();
      if (newVersion !== this.versions[versionKey]) {
        this.embark.logger.warn(__('There is a space in the version of {{versionKey}}. We corrected it for you ({{correction}}).', {versionKey: versionKey, correction: `"${this.versions[versionKey]}" => "${newVersion}"`}));
        this.versions[versionKey] = newVersion;
      }
    });
  }

  registerCommands() {
    const self = this;
    const matches = ['versions'];
    if (__('versions') !== matches[0]) {
      matches.push(__('versions'));
    }
    this.embark.registerConsoleCommand({
      matches,
      description: __("display versions in use for libraries and tools like web3 and solc"),
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

    for(let oldLib in DEPRECATIONS) {
      let replacement = DEPRECATIONS[oldLib];
      this.embark.events.setCommandHandler('version:get:' + oldLib, (cb) => {
        self.logger.warn(`${oldLib} has been deprecated in favor of ${replacement}. This will be used instead.`);
        self.embark.events.request(`version:get:${replacement}`, cb);
      });
    }
  }

  downloadIfNeeded(packageName, cb) {
    const wantedVersion = this.versions[packageName];
    let installedVersion = this.embark.config.package.dependencies[packageName];
    if (!wantedVersion || wantedVersion === installedVersion) {
      const nodePath = embarkPath('node_modules');
      const packagePath = require.resolve(packageName, {paths: [nodePath]});
      return cb(null, packagePath.replace(/\\/g, '/'));
    }
    // Download package
    this.embark.events.request("version:getPackageLocation", packageName, wantedVersion, (err, location) => {
      cb(err, dappPath(location).replace(/\\/g, '/'));
    });
  }

  listenToCommandsToGetLibrary() {
    const self = this;
    let npm = new Npm({logger: this.embark.logger, useDashboard: this.useDashboard});
    this.embark.events.setCommandHandler('version:getPackageLocation', (libName, version, cb) => {
      if(DEPRECATIONS[libName]) {
        self.logger.warn(`${libName} has been deprecated in favor of ${DEPRECATIONS[libName]}. This will be used instead.`);
        libName = DEPRECATIONS[libName];
      }
      npm.getPackageVersion(libName, version, cb);
    });
    this.embark.events.setCommandHandler('version:downloadIfNeeded', (libName, cb) => {
      if(DEPRECATIONS[libName]) {
        self.logger.warn(`${libName} has been deprecated in favor of ${DEPRECATIONS[libName]}. This will be used instead.`);
        libName = DEPRECATIONS[libName];
      }
      this.downloadIfNeeded(libName, cb);
    });
    this.embark.events.setCommandHandler('version:getPackagePath', (libName, version, cb) => {
      if(DEPRECATIONS[libName]) {
        self.logger.warn(`${libName} has been deprecated in favor of ${DEPRECATIONS[libName]}. This will be used instead.`);
        libName = DEPRECATIONS[libName];
      }
      cb(null, Npm.getPackagePath(libName, version));
    });
  }

}

module.exports = LibraryManager;
