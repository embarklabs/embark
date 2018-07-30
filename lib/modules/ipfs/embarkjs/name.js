/*global __embarkIPFS*/


const NoConnectionError = 'No IPFS connection. Please ensure to call Embark.Names.setProvider()';
const NotAvailableError = 'Not available with ipns';

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

__embarkIPFS.lookup = function () {
  return new Error(NotAvailableError);
};

__embarkIPFS.registerSubDomain = function () {
  return new Error(NotAvailableError);
};
