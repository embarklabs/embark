__embarkIPFS.resolve = function (name, callback) {
  callback = callback || function () {};
  if (!this._ipfsConnection) {
    var connectionError = new Error('No IPFS connection. Please ensure to call Embark.Names.setProvider()');
    return callback(connectionError);
  }

  this._ipfsConnection.name.resolve(name, (err, res) => {
    if (err) {
      return callback(name + " is not registered");
    }
    callback(err, res.value);
  });
};

__embarkIPFS.register = function(addr, options) {
  if (!this._ipfsConnection) {
    return new Error('No IPFS connection. Please ensure to call Embark.Names.setProvider()');
  }

  return this._ipfsConnection.name.publish(addr, options, function (err, res) {
    if (err) {
      return new Error('No IPFS connection. Please ensure to call Embark.Names.setProvider()');
    }

    return `https://gateway.ipfs.io/ipns/${res.name}`;
  });
};

__embarkIPFS.lookup = function () {
  return new Error("Not Implemented");
};
