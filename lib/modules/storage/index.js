const _ = require('underscore');

const IpfsModule = require('../ipfs');
const SwarmModule = require('../swarm');

class Storage {
  constructor(embark, options){
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

  addSetProviders() {
    const self = this;

    let code = `\nEmbarkJS.Storage.setProviders(${JSON.stringify(this.storageConfig.dappConnection)});`;

    let shouldInit = (storageConfig) => {
      return storageConfig.enabled;
    };

    this.embark.addProviderInit('storage', code, shouldInit);
  }

}

module.exports = Storage;
