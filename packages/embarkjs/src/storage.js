import {detectSeries} from './async';

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
    throw new Error('Unknown storage provider');
  }

  this.currentProviderName = providerName;
  this.currentStorage = provider;

  return provider.setProvider(options);
};

Storage.isAvailable = function () {
  if (!this.currentStorage) {
    return false;
  }
  return this.currentStorage.isAvailable();
};

// TODO: most of this logic should move to the provider implementations themselves
Storage.setProviders = async function (dappConnOptions) {
  const self = this;
  try {
    await detectSeries(dappConnOptions, async (dappConn, callback) => {
      if(dappConn === '$BZZ' || dappConn.provider === 'swarm'){
        let options = dappConn;
        if(dappConn === '$BZZ') options = {"useOnlyGivenProvider": true};
        try{
          await self.setProvider('swarm', options);
          let isAvailable = await self.isAvailable();
          callback(null, isAvailable);
        }catch(err){
          callback(null, false); // catch errors for when bzz object not initialised but config has requested it to be used
        }
      }
      else if(dappConn.provider === 'ipfs') {
        // set the provider then check the connection, if true, use that provider, else, check next provider
        try{
          await self.setProvider('ipfs', dappConn);
          let isAvailable =  await self.isAvailable();
          callback(null, isAvailable);
        } catch(err) {
          callback(null, false); // catch but keep looping by not passing err to callback
        }
      }
    }, function(err, result){
      if(!result) console.error('Could not connect to a storage provider using any of the dappConnections in the storage config');
    });
  } catch (err) {
    console.error('Failed to connect to a storage provider: ' + err.message);
  }
};

export default Storage;
