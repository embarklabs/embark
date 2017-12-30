
class LibraryManager {

  constructor(options) {
    this.plugins = options.plugins;
    this.config = options.config;
    this.contractsConfig = this.config.contractsConfig;

    this.embark = this.plugins.createPlugin('libraryManager', {});

    this.registerCommands();
  }

  registerCommands() {
    const self = this;
    this.embark.registerConsoleCommand((cmd, _options) => {
      if (cmd === "versions") {
        let solcVersionInConfig = self.contractsConfig.versions.solc;
        let web3VersionInConfig = self.contractsConfig.versions["web3.js"];
        let ipfsApiVersion = require('../../package.json').dependencies["ipfs-api"];

        let text = [
          'versions in use:',
          'solc: ' + solcVersionInConfig,
          'web3.js: ' + web3VersionInConfig,
          'ipfs-api: ' + ipfsApiVersion
        ];

        return text.join('\n');
      }
      return false;
    });
  }

}

module.exports = LibraryManager;
