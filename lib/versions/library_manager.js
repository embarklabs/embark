var Npm = require('./npm.js');

class LibraryManager {

  constructor(options) {
    this.plugins = options.plugins;
    this.config = options.config;
    this.contractsConfig = this.config.contractsConfig;
    this.storageConfig = this.config.storageConfig;

    this.embark = this.plugins.createPlugin('libraryManager', {});

    this.determineVersions();

    this.registerCommands();
    this.listenToCommandsToGetVersions();
    this.listenToCommandsToGetLibrary();
  }

  determineVersions() {
    this.versions = {};

    let solcVersionInConfig = this.contractsConfig.versions.solc;
    let web3VersionInConfig = this.contractsConfig.versions["web3"];
    let ipfsApiVersion = this.storageConfig.versions["ipfs-api"];
    let pIterationVersion = this.storageConfig.versions["p-iteration"];

    this.versions['solc'] = solcVersionInConfig;
    this.versions['web3'] = web3VersionInConfig;
    this.versions['ipfs-api'] = ipfsApiVersion;
    this.versions['p-iteration'] = pIterationVersion;

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
    this.embark.registerConsoleCommand((cmd, _options) => {
      if (cmd === "versions" || cmd === __('versions')) {
        let text = [__('versions in use') + ':'];
        for (let lib in self.versions) {
          text.push(lib + ": " + self.versions[lib]);
        }
        return text.join('\n');
      }
      return false;
    });
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

  listenToCommandsToGetLibrary() {
    this.embark.events.setCommandHandler('version:getPackageLocation', (libName, version, cb) => {
      let npm = new Npm({logger: this.embark.logger, packageName: libName, version:version});
      npm.getPackageVersion(libName, version, cb);
    });
    this.embark.events.setCommandHandler('version:getPackagePath', (libName, version, cb) => {
      cb(null, Npm.getPackagePath(libName, version));
    });
  }

}

module.exports = LibraryManager;
