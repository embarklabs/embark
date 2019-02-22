const path = require('path');

class EmbarkJSWeb3Connector {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;
    this.fs = embark.fs;
    this.config = embark.config;
    this.constants = embark.constants;
    this.registerProvider();
  }

  async registerProvider() {
    let blockchainConnectorReady = false;
    await this.whenRuncodeReady();

    const web3LocationPromise = this.getWeb3Location();

    this.events.setCommandHandler('blockchain:connector:ready', (cb) => {
      if (blockchainConnectorReady) {
        return cb();
      }
      this.events.once("blockchain:connector:ready", () => {
        cb();
      });
    });

    web3LocationPromise.then((_web3Location) => {
      blockchainConnectorReady = true;
      this.events.emit('blockchain:connector:ready');
    });

    let web3Location = await web3LocationPromise;
    web3Location = web3Location.replace(/\\/g, '/');

    await this.registerVar('__Web3', require(web3Location));

    const symlinkLocation = await this.generateSymlink(web3Location);

    let code = `\nconst Web3 = global.__Web3 || require('${symlinkLocation}');`;
    code += `\nglobal.Web3 = Web3;`;

    const connectorCode = this.fs.readFileSync(path.join(__dirname, 'embarkJSWeb3Connector.js'), 'utf8');
    code += connectorCode;

    code += "\nEmbarkJS.Blockchain.registerProvider('web3', embarkJSWeb3Connector);";
    code += "\nEmbarkJS.Blockchain.setProvider('web3', {});";

    const configPath = this.fs.dappPath(this.config.embarkConfig.generationDir, this.constants.dappArtifacts.dir, this.constants.dappArtifacts.blockchain).replace(/\\/g, '/');

    code += `\nif (!global.__Web3) {`; // Only connect when in the Dapp
    code += `\n  const web3ConnectionConfig = require('${configPath}');`;
    code += `\n  EmbarkJS.Blockchain.connect(web3ConnectionConfig, (err) => {if (err) { console.error(err); } });`;
    code += `\n}`;

    this.embark.addCodeToEmbarkJS(code);

    code = "EmbarkJS.Blockchain.setProvider('web3', {web3});";

    const shouldInit = (_config) => {
      return true;
    };

    this.embark.addConsoleProviderInit('blockchain', code, shouldInit);
  }

  whenRuncodeReady() {
    return new Promise((resolve) => {
      this.events.on('runcode:ready', () => {
        resolve();
      });
    });
  }

  getWeb3Location() {
    return new Promise((resolve, reject) => {
      this.events.request("version:get:web3", (web3Version) => {
        if (web3Version === "1.0.0-beta") {
          const nodePath = this.fs.embarkPath('node_modules');
          const web3Path = require.resolve("web3", {paths: [nodePath]});
          return resolve(web3Path);
        }
        this.events.request("version:getPackageLocation", "web3", web3Version, (err, location) => {
          if (err) {
            return reject(err);
          }
          const locationPath = this.fs.embarkPath(location);
          resolve(locationPath);
        });
      });
    });
  }

  generateSymlink(location) {
    return new Promise((resolve, reject) => {
      this.events.request('code-generator:symlink:generate', location, 'web3', (err, symlinkDest) => {
        if (err) {
          return reject(err);
        }
        resolve(symlinkDest);
      });
    });
  }

  registerVar(name, code) {
    return new Promise((resolve) => {
      this.events.emit('runcode:register', name, code, () => {
        resolve();
      });
    });
  }
}

module.exports = EmbarkJSWeb3Connector;
