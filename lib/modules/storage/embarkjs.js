/* global EmbarkJS */

import {detectSeries} from 'async';

let __embarkStorage = {};

__embarkStorage.setProviders = async function (dappConnOptions) {
    try {
      await detectSeries(dappConnOptions, async (dappConn, callback) => {
        if(dappConn === '$BZZ' || dappConn.provider === 'swarm'){
          let options = dappConn;
          if(dappConn === '$BZZ') options = {"useOnlyGivenProvider": true};
          try{
            await EmbarkJS.Storage.setProvider('swarm', options);
            let isAvailable = await EmbarkJS.Storage.isAvailable();
            callback(null, isAvailable);
          }catch(err){
            callback(null, false); // catch errors for when bzz object not initialised but config has requested it to be used
          }
        }
        else if(dappConn.provider === 'ipfs') {
          // set the provider then check the connection, if true, use that provider, else, check next provider
          try{
            await EmbarkJS.Storage.setProvider('ipfs', dappConn);
            let isAvailable =  await EmbarkJS.Storage.isAvailable();
            callback(null, isAvailable);
          } catch(err) {
            callback(null, false); // catch but keep looping by not passing err to callback
          }
        }
      }, function(err, result){
        if(!result) throw new Error('Could not connect to a storage provider using any of the dappConnections in the storage config');
      });
    } catch (err) {
      throw new Error('Failed to connect to a storage provider: ' + err.message);
    }
  };
