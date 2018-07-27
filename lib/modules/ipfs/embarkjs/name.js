/*global __embarkIPFS*/

__embarkIPFS.resolve = function (name, callback) {
  callback = callback || function () {};
  if (!this._ipfsConnection) {
    var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Names.setProvider()');
    return callback(connectionError);
  }

  this._ipfsConnection.name.resolve(name)
    .then(res => {
      callback(null, res.Path);
    })
    .catch(() => {
      return callback(name + " is not registered");
    });
};

__embarkIPFS.register = function(addr, options) {
  if (!this._ipfsConnection) {
    return new Error('No IPFS connection. Please ensure to call Embark.Names.setProvider()');
  }

  this._ipfsConnection.name.publish("/ipfs/" + addr, options)
    .then(res => {
      return `https://gateway.ipfs.io/ipns/${res.name}`;
    })
    .catch((err) => {
      return new Error('Unexpected Error: ' + err);
    });
};

__embarkIPFS.lookup = function () {
  return new Error("Not Implemented");
};
