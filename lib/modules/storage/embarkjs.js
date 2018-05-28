/* global EmbarkJS */

import {findSeries} from 'p-iteration';

let __embarkStorage = {};

__embarkStorage.setProviders = async function (dappConnOptions) {
    var self = this;
    try {
      let workingConnFound = await findSeries(dappConnOptions, async (dappConn) => {
        if(dappConn === '$BZZ' || dappConn.provider === 'swarm'){
          let options = dappConnOptions;
          options.useOnlyCurrentProvider = dappConn === '$BZZ';
          await EmbarkJS.Storage.setProvider('swarm', options);
          return EmbarkJS.Storage.isAvailable();
        }
        else if(dappConn.provider === 'ipfs') {
          // set the provider then check the connection, if true, use that provider, else, check next provider
          try{
            await EmbarkJS.Storage.setProvider('ipfs', dappConn);
            return EmbarkJS.Storage.isAvailable();
          } catch(err) {
            return false;
          }
        }
      });
      if(!workingConnFound) throw new Error('Could not connect to a storage provider using any of the dappConnections in the storage config');
    } catch (err) {
      self.ipfsConnection = null;
      throw new Error('Failed to connect to IPFS: ' + err.message);
    }
  };
