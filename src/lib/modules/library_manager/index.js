var Npm = require('./npm.js');

class LibraryManager {

  constructor(embark) {
    this.embark = embark;
    this.config = embark.config;
    this.contractsConfig = this.config.contractsConfig;
    this.storageConfig = this.config.storageConfig;

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
    let ipfsApiVersion = this.storageConfig.versions["ipfs-api"];

    this.versions['solc'] = solcVersionInConfig;
    this.versions['web3'] = web3VersionInConfig;
    this.versions['ipfs-api'] = ipfsApiVersion;

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
      return {
        match: () => cmd === "versions" || cmd === __('versions'),
        process: (callback) => {
          let text = [__('versions in use') + ':'];
          for (let lib in self.versions) {
            text.push(lib + ": " + self.versions[lib]);
          }
          callback(null, text.join('\n'));
        }
      };
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

  listenToCommandsToGetLibrary() {
    let npm = new Npm({logger: this.embark.logger});
    this.embark.events.setCommandHandler('version:getPackageLocation', (libName, version, cb) => {
      npm.getPackageVersion(libName, version, cb);
    });
    this.embark.events.setCommandHandler('version:getPackagePath', (libName, version, cb) => {
      cb(null, Npm.getPackagePath(libName, version));
    });
  }

}

module.exports = LibraryManager;
