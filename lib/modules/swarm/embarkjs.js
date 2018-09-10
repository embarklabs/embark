/*global web3 */
import SwarmJS  from 'swarmjs';
let __embarkSwarm = {_swarmConnection: undefined};
import bytes from "eth-lib/lib/bytes";

__embarkSwarm.setProvider = function (options) {
  let protocol = options.protocol || 'http';
  let port = options.port ? `:${options.port}` : '';

  this._config = options;
  this._connectUrl = `${protocol}://${options.host}${port}`;
  this._connectError = new Error(`Cannot connect to Swarm node on ${this._connectUrl}`);

  return new Promise((resolve, reject) => {
    try {
      if (!web3.bzz.currentProvider && !options.useOnlyGivenProvider) {
        this._swarmConnection = new SwarmJS({gateway: this._connectUrl});
      }
      else if(options.useOnlyGivenProvider && web3.bzz.givenProvider !== null){
        this._swarmConnection = new SwarmJS({gateway: web3.bzz.givenProvider});
      }
      resolve(this);
    } catch (err) {
      console.log(err);
      reject(this._connectError);
    }
  });
};

__embarkSwarm.isAvailable = function () {
  return new Promise((resolve, reject) => {
    // if web3 swarm object doesn't exist
    if (!this.swarm) {
      return resolve(false);
    }
    // swarm obj exists, but has no provider set (seems to happen a LOT!),
    // try setting the provider to our currently set provider again
    else if(!this._swarmConnection.gateway && this._config.host){
      this._swarmConnection.gateway = this._connectUrl;
    }
    if (!this._swarmConnection.gateway) {
      return resolve(false);
    }
    this._swarmConnection.isAvailable()
      .then(resolve)
      .catch(() => {
        reject(this._connectError);
      });
  });
};

__embarkSwarm.saveText = function (text) {
  return new Promise((resolve, reject) => {
    this.isAvailable().then((isAvailable) => {
      if (!isAvailable) {
        return reject(this._connectError);
      }
      this._swarmConnection.uploadRaw(text)
        .then(resolve)
        .catch(reject);
    }).catch(reject);
  });
};

__embarkSwarm.get = function (hash) {
  return new Promise((resolve, reject) => {
    this.isAvailable().then((isAvailable) => {
      if (!isAvailable) {
        return reject(this._connectError);
      }
      this._swarmConnection.downloadRaw(hash)
        .then((uint8Array) => resolve(bytes.toString(bytes.fromUint8Array(uint8Array))))
        .catch(reject);
    }).catch(reject);
  });
};

__embarkSwarm.uploadFile = function (inputSelector) {
  let file = inputSelector[0].files[0];

  if (file === undefined) {
    throw new Error('no file found');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = (event) => {
      const fileContent = new Uint8Array(event.target.result);
      this.isAvailable().then((isAvailable) => {
        if (!isAvailable) {
          return reject(this._connectError);
        }
        this._swarmConnection.upload(fileContent)
          .then(resolve)
          .catch(reject);
      }).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

__embarkSwarm.getUrl = function (hash) {
  return `${this._config.getUrl || (this._connectUrl + '/bzz-raw:/')}${hash}`;
};

const NotAvailable = "Not available with Swarm";

__embarkSwarm.resolve = function (_name, callback) {
  callback(NotAvailable);
};

__embarkSwarm.register = function (_addr, callback) {
  callback(NotAvailable);
};
