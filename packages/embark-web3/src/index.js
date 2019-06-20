/* global __dirname module process require */

const { __ } = require('embark-i18n');
const { dappPath, embarkPath, normalizePath, toForwardSlashes } = require('embark-utils');
const constants = require('embark-core/constants');
const path = require('path');

class EmbarkWeb3 {
  constructor(embark, _options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.config = embark.config;
    this.modulesPath = dappPath(embark.config.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);

    this.addWeb3ToEmbarkJS();
  }

  async addWeb3ToEmbarkJS() {
    let blockchainConnectorReady = false;

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
    web3Location = normalizePath(web3Location, true);

    await this.registerVar('__Web3', require(web3Location));

    const symlinkLocation = await this.generateSymlink(web3Location);

    let code = `\nconst Web3 = global.__Web3 || require('${symlinkLocation}');`;
    code += `\nglobal.Web3 = Web3;`;

    let linkedModulePath = path.join(this.modulesPath, 'embarkjs-web3');
    if (process.platform === 'win32') linkedModulePath = linkedModulePath.replace(/\\/g, '\\\\');

    code += `\n
      const __embarkWeb3 = require('${linkedModulePath}');
      EmbarkJS.Blockchain.registerProvider('web3', __embarkWeb3.default || __embarkWeb3);
      EmbarkJS.Blockchain.setProvider('web3', {});
    `;

    const configPath = toForwardSlashes(dappPath(this.config.embarkConfig.generationDir, constants.dappArtifacts.dir, constants.dappArtifacts.blockchain));

    code += `\nif (!global.__Web3) {`; // Only connect when in the Dapp
    code += `\n  const web3ConnectionConfig = require('${configPath}');`;
    code += `\n  EmbarkJS.Blockchain.connect(web3ConnectionConfig, (err) => {if (err) { console.error(err); } });`;
    code += `\n}`;
    this.events.request('version:downloadIfNeeded', 'embarkjs-web3', (err, location) => {
      if (err) {
        this.logger.error(__('Error downloading embarkjs-web3'));
        throw err;
      }

      this.embark.addProviderInit("blockchain", code, () => { return true; });

      // Make sure that we use our web3 for the console and the tests
      code += `if (typeof web3 === 'undefined') {
        throw new Error('Global web3 is not present');
      }
      EmbarkJS.Blockchain.setProvider('web3', {web3});`;

      this.embark.addConsoleProviderInit("blockchain", code, () => { return true; });

      this.embark.addGeneratedCode((cb) => {
        return cb(null, code, 'embarkjs-web3', location);
      });
    });
  }

  getWeb3Location() {
    return new Promise((resolve, reject) => {
      this.events.request("version:get:web3", (web3Version) => {
        if (web3Version === "1.0.0-beta") {
          const nodePath = embarkPath('node_modules');
          const web3Path = require.resolve("web3", {paths: [nodePath]});
          return resolve(web3Path);
        }
        this.events.request("version:getPackageLocation", "web3", web3Version, (err, location) => {
          if (err) {
            return reject(err);
          }
          const locationPath = embarkPath(location);
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

module.exports = EmbarkWeb3;
