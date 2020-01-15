import {detectSeries} from './async';
require('colors');

const Storage = {};

Storage.Providers = {};
Storage.noProviderError = 'Storage provider not set; e.g EmbarkJS.Storage.setProvider("ipfs")';

Storage.saveText = function (text) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.saveText(text);
};

Storage.get = function (hash) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.get(hash);
};

Storage.uploadFile = function (inputSelector) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.uploadFile(inputSelector);
};

Storage.getUrl = function (hash) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.getUrl(hash);
};

Storage.resolve = function (name, callback) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.resolve(name, callback);
};

Storage.register = function (addr, callback) {
  if (!this.currentStorage) {
    throw new Error(this.noProviderError);
  }
  return this.currentStorage.register(addr, callback);
};

Storage.registerProvider = function (providerName, obj) {
  this.Providers[providerName] = obj;
};

Storage.setProvider = function (providerName, options) {
  let provider = this.Providers[providerName];

  if (!provider) {
    if (providerName === 'ipfs') {
      console.log("the embarkjs-ipfs package might be missing from your project dependencies");
    }
    if (providerName === 'swarm') {
      console.log("the embarkjs-swarm package might be missing from your project dependencies");
    }
    throw new Error('Unknown storage provider: ' + providerName);
  }

  this.currentProviderName = providerName;
  this.currentStorage = provider;

  return provider.setProvider(options);
};

Storage.isAvailable = function () {
  if (!this.currentStorage) {
    return Promise.resolve(false);
  }
  return this.currentStorage.isAvailable();
};

// TODO: most of this logic should move to the provider implementations themselves
Storage.setProviders = function (dappConnOptions, addlOpts) {
  const self = this;
  detectSeries(dappConnOptions, (dappConn, callback) => {
    let options = dappConn;
    if (dappConn === '$BZZ') options = {"useOnlyGivenProvider": true};
    options = {...options, ...addlOpts, ...dappConn};
    try {
      self.setProvider(dappConn === '$BZZ' ? dappConn : dappConn.provider, options).then(() => {
        self.isAvailable().then((isAvailable) => {
          callback(null, isAvailable);
        }).catch(() => {
          callback(null, false);
        });
      }).catch(() => {
        callback(null, false); // catch errors for when bzz object not initialised but config has requested it to be used
      });
    } catch (err) {
      callback(null, false);
    }
  }, function (err, result) {
    if (!result) console.log('Could not connect to a storage provider using any of the dappConnections in the storage config'.red);
  });
};

export default Storage;
