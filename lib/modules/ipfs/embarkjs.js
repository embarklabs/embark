/*global IpfsApi*/

let __embarkIPFS = {};

const NoConnectionError = 'No IPFS connection. Please ensure to call Embark.Storage.setProvider()';

__embarkIPFS.setProvider = function (options) {
  var self = this;
  return new Promise(function (resolve, reject) {
    try {
      if (!options) {
        self._config = options;
        self._ipfsConnection = IpfsApi('localhost', '5001');
        self._getUrl = "http://localhost:8080/ipfs/";
      } else {
        var ipfsOptions = {host: options.host || options.server, protocol: 'http'};
        if (options.protocol) {
          ipfsOptions.protocol = options.protocol;
        }
        if (options.port && options.port !== 'false') {
          ipfsOptions.port = options.port;
        }
        self._ipfsConnection = IpfsApi(ipfsOptions);
        self._getUrl = options.getUrl || "http://localhost:8080/ipfs/";
      }
      resolve(self);
    } catch (err) {
      console.error(err);
      self._ipfsConnection = null;
      reject(new Error('Failed to connect to IPFS'));
    }
  });
};

__embarkIPFS.isAvailable = function () {
  return new Promise((resolve) => {
    if (!this._ipfsConnection) {
      return resolve(false);
    }
    this._ipfsConnection.id()
      .then((id) => {
        resolve(Boolean(id));
      })
      .catch((err) => {
        console.error(err);
        resolve(false);
      });
  });
};

__embarkIPFS.saveText = function (text) {
  const self = this;
  var promise = new Promise(function (resolve, reject) {
    if (!self._ipfsConnection) {
      var connectionError = new Error(NoConnectionError);
      return reject(connectionError);
    }
    self._ipfsConnection.add(self._ipfsConnection.Buffer.from(text), function (err, result) {
      if (err) {
        return reject(err);
      }

      resolve(result[0].path);
    });
  });

  return promise;
};

__embarkIPFS.get = function (hash) {
  const self = this;
  // TODO: detect type, then convert if needed
  //var ipfsHash = web3.toAscii(hash);
  var promise = new Promise(function (resolve, reject) {
    if (!self._ipfsConnection) {
      var connectionError = new Error(NoConnectionError);
      return reject(connectionError);
    }
    self._ipfsConnection.get(hash, function (err, files) {
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
    if (!self._ipfsConnection) {
      var connectionError = new Error(NoConnectionError);
      return reject(connectionError);
    }
    var reader = new FileReader();
    reader.onloadend = function () {
      var fileContent = reader.result;
      var buffer = self._ipfsConnection.Buffer.from(fileContent);
      self._ipfsConnection.add(buffer, function (err, result) {
        if (err) {
          return reject(err);
        }

        resolve(result[0].path);
      });
    };
    reader.readAsArrayBuffer(file);
  });

  return promise;
};

__embarkIPFS.getUrl = function (hash) {
  return (this._getUrl || "http://localhost:8080/ipfs/") + hash;
};

__embarkIPFS.resolve = function (name, callback) {
  callback = callback || function () {};
  if (!this._ipfsConnection) {
    var connectionError = new Error(NoConnectionError);
    return callback(connectionError);
  }

  this._ipfsConnection.name.resolve(name)
    .then(res => {
      callback(null, res.Path);
    })
    .catch(() => {
      callback(name + " is not registered");
    });
};

__embarkIPFS.register = function(addr, callback) {
  callback = callback || function () {};
  if (!this._ipfsConnection) {
    return new Error(NoConnectionError);
  }

  this._ipfsConnection.name.publish("/ipfs/" + addr)
    .then(res => {
      callback(null, res.Name);
    })
    .catch(() => {
      callback(addr + " could not be registered");
    });
};
