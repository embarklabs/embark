let __embarkIPFS = {};

__embarkIPFS.setProvider = function(options) {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    self.currentStorage = EmbarkJS.Storage.IPFS;

    try {
      if (options === undefined) {
        self.ipfsConnection = IpfsApi('localhost', '5001');
        self._getUrl = "http://localhost:8080/ipfs/";
      } else {
        self.ipfsConnection = IpfsApi(options.server, options.port);
        self._getUrl = options.getUrl || "http://localhost:8080/ipfs/";
      }
      resolve(self);
    } catch (err) {
      console.log(err);
      self.ipfsConnection = null;
      reject(new Error('Failed to connect to IPFS'));
    }
  });
  return promise;
};

__embarkIPFS.saveText = function(text) {
  const self = this;
  var promise = new Promise(function(resolve, reject) {
    if (!this.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    self.ipfsConnection.add((new self.ipfsConnection.Buffer(text)), function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result[0].path);
      }
    });
  });

  return promise;
};

__embarkIPFS.get = function(hash) {
  // TODO: detect type, then convert if needed
  //var ipfsHash = web3.toAscii(hash);
  var promise = new Promise(function(resolve, reject) {
    if (!self.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    self.ipfsConnection.object.get(hash).then(function(node) {
      resolve(node.data.toString());
    }).catch(function(err) {
      reject(err);
    });
  });

  return promise;
};

__embarkIPFS.uploadFile = function(inputSelector) {
  var file = inputSelector[0].files[0];

  if (file === undefined) {
    throw new Error('no file found');
  }

  var promise = new Promise(function(resolve, reject) {
    if (!self.ipfsConnection) {
      var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Storage.setProvider()');
      reject(connectionError);
    }
    var reader = new FileReader();
    reader.onloadend = function() {
      var fileContent = reader.result;
      var buffer = self.ipfsConnection.Buffer.from(fileContent);
      self.ipfsConnection.add(buffer, function(err, result) {
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

__embarkIPFS.getUrl = function(hash) {
  return (self._getUrl || "http://localhost:8080/ipfs/") + hash;
};

EmbarkJS.Storage.registerProvider('ipfs', __embarkIPFS);
