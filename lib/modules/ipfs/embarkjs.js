import IpfsApi from 'ipfs-api';
//import {some} from 'p-iteration';

let __embarkIPFS = {};

__embarkIPFS.setProvider = function (options) {
  var self = this;
  var promise = new Promise(function (resolve, reject) {
    try {
      if (options === undefined) {
        self.ipfsConnection = IpfsApi('localhost', '5001');
        self._getUrl = "http://localhost:8080/ipfs/";
      } else {
        var ipfsOptions = {host: options.host || options.server, protocol: 'http'};
        if (options.protocol) {
          ipfsOptions.protocol = options.protocol;
        }
        if (options.port && options.port !== 'false') {
          ipfsOptions.port = options.port;
        }
        self.ipfsConnection = IpfsApi(ipfsOptions);
        self._getUrl = options.getUrl || "http://localhost:8080/ipfs/";
      }
      resolve(self);
    } catch (err) {
      console.error(err);
      self.ipfsConnection = null;
      reject(new Error('Failed to connect to IPFS'));
    }
  });
  return promise;
};

__embarkIPFS.setProviders = async function (dappConnOptions) {
  var self = this;
  try {
    let workingConnFound = await some(dappConnOptions, async (dappConn) => {
      if(dappConn === '$BZZ' || dappConn.provider !== 'ipfs') return false; // swarm has no bearing for ipfs plugin, continue
      else {
        // set the provider then check the connection, if true, use that provider, else, check next provider
        try{
          await self.setProvider(dappConn);
          return await self.isAvailable();
        } catch(err) {
          return false;
        }
      }
    });
    if(!workingConnFound) throw new Error('Could not connect to IPFS using any of the dappConnections in the storage config');
    else return self;
  } catch (err) {
    self.ipfsConnection = null;
    throw new Error('Failed to connect to IPFS: ' + err.message);
  }
};

__embarkIPFS.saveText = function (text) {
  const self = this;
  var promise = new Promise(function (resolve, reject) {
    if (!self.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    self.ipfsConnection.add(self.ipfsConnection.Buffer.from(text), function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0].path);
      }
    });
  });

  return promise;
};

__embarkIPFS.get = function (hash) {
  const self = this;
  // TODO: detect type, then convert if needed
  //var ipfsHash = web3.toAscii(hash);
  var promise = new Promise(function (resolve, reject) {
    if (!self.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    self.ipfsConnection.get(hash, function (err, files) {
      if (err) {
        return reject(err);
      }
      resolve(files[0].content.toString());
    });
  });

  return promise;
};

__embarkIPFS.uploadFile = function (inputSelector) {
  const self = this;
  var file = inputSelector[0].files[0];

  if (file === undefined) {
    throw new Error('no file found');
  }

  var promise = new Promise(function (resolve, reject) {
    if (!self.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    var reader = new FileReader();
    reader.onloadend = function () {
      var fileContent = reader.result;
      var buffer = self.ipfsConnection.Buffer.from(fileContent);
      self.ipfsConnection.add(buffer, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].path);
        }
      });
    };
    reader.readAsArrayBuffer(file);
  });

  return promise;
};

__embarkIPFS.isAvailable = function () {
  return new Promise((resolve) => {
    if (!this.ipfsConnection) {
      return resolve(false);
    }
    this.ipfsConnection.id()
      .then((id) => {
        resolve(Boolean(id));
      })
      .catch(() => {
        resolve(false);
      });
  });
};

__embarkIPFS.getUrl = function (hash) {
  return (this._getUrl || "http://localhost:8080/ipfs/") + hash;
};


