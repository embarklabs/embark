var Npm = require('./npm.js');

class LibraryManager {

  constructor(options) {
    this.plugins = options.plugins;
    this.config = options.config;
    this.contractsConfig = this.config.contractsConfig;

    this.embark = this.plugins.createPlugin('libraryManager', {});

    this.determineVersions();

    this.registerCommands();
    this.listenToCommandsToGetVersions();
    this.listenToCommandsToGetLibrary();
  }

  determineVersions() {
    this.versions = {};

    let solcVersionInConfig = this.contractsConfig.versions.solc;
    let web3VersionInConfig = this.contractsConfig.versions["web3.js"];
    let ipfsApiVersion = require('../../package.json').dependencies["ipfs-api"];

    this.versions['solc'] = solcVersionInConfig;
    this.versions['web3'] = web3VersionInConfig;
    this.versions['ipfs-api'] = ipfsApiVersion;
  }

  registerCommands() {
    const self = this;
    this.embark.registerConsoleCommand((cmd, _options) => {
      if (cmd === "versions") {
        let text = ['versions in use:'];
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
    // TODO: generalize to any lib
    let libName = "solc";
    let npm = new Npm({logger: this.embark.logger});
    this.embark.events.setCommandHandler('version:getPackageLocation:' + libName, (version, cb) => {
      npm.getPackageVersion(libName, version, false, false, cb);
    });
    this.embark.events.setCommandHandler('version:getPackageContent:' + libName, (version, cb) => {
      npm.getPackageVersion(libName, version, false, true, cb);
    });
  }

}

module.exports = LibraryManager;
