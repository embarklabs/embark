const _ = require('underscore');

const IpfsModule = require('../ipfs');
const SwarmModule = require('../swarm');

class Storage {
  constructor(embark, options){
    const self = this;
    this.embark = embark;
    this.storageConfig = embark.config.storageConfig;

    if (!this.storageConfig.enabled) return;

    this.addSetProviders();

    new IpfsModule(embark, options); /*eslint no-new: "off"*/
    new SwarmModule(embark, options); /*eslint no-new: "off"*/

    embark.events.setCommandHandler('storage:upload', (cb) => {
      let platform = options.storageConfig.upload.provider;

      if (['swarm', 'ipfs'].indexOf(platform) === -1) {
        return cb({message: __('platform "{{platform}}" is specified as the upload provider, however no plugins have registered an upload command for "{{platform}}".', {platform: platform})});
      }

      embark.events.request("storage:upload:" + platform, cb);
    });
  }

  /**
   * Adds the code to call setProviders in embarkjs after embark is ready
   * 
   * @returns {void}
   */
  addSetProviders() {
    const self = this;
    // filter list of dapp connections based on available_providers set in config
    let hasSwarm = _.contains(this.storageConfig.available_providers, 'swarm'); // don't need to eval this in every loop iteration
    // contains valid dapp storage providers
    this._validDappProviders = _.filter(this.storageConfig.dappConnection, (conn) => {
      return _.contains(self.storageConfig.available_providers, conn.provider) || (conn === '$BZZ' && hasSwarm);
    });

    let code = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this._validDappProviders)});`;
    let shouldInit = (storageConfig) => {
      return (this._validDappProviders !== undefined && this._validDappProviders.length > 0 && storageConfig.enabled === true);
    };

    this.embark.addProviderInit('storage', code, shouldInit);
  }

}

module.exports = Storage;
