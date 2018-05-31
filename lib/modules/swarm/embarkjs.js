/*global web3 */
let __embarkSwarm = {};
const bytes = require("eth-lib/lib/bytes");

__embarkSwarm.setProvider = function (options) {
  let protocol = options.protocol || 'http';
  let port = options.port ? `:${options.port}` : '';

  this._config = options;
  this._connectUrl = `${protocol}://${options.host}${port}`;
  this._connectError = new Error(`Cannot connect to Swarm node on ${this._connectUrl}`);

  this._config = options;
  this._connectUrl = `${protocol}://${options.host}${port}`;
  this._connectError = new Error(`Cannot connect to Swarm node on ${this._connectUrl}`);

  return new Promise((resolve, reject) => {
    try {
      if (!web3.bzz.currentProvider && !options.useOnlyGivenProvider) {
        web3.bzz.setProvider(this._connectUrl);
      }
      else if(options.useOnlyGivenProvider && web3.bzz.givenProvider !== null){
        web3.bzz.setProvider(web3.bzz.givenProvider);
      }
      else if(options.useOnlyGivenProvider && web3.bzz.givenProvider !== null){
        web3.bzz.setProvider(web3.bzz.givenProvider);
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
    if (!web3.bzz) {
      return resolve(false);
    }
    // swarm obj exists, but has no provider set (seems to happen a LOT!),
    // try setting the provider to our currently set provider again
    else if(!web3.bzz.currentProvider && this._config.host){
      web3.bzz.setProvider(this._connectUrl);
    }
    if (!web3.bzz.currentProvider) {
      return resolve(false);
    }
    web3.bzz.isAvailable()
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
      web3.bzz.upload(text)
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
      web3.bzz.download(hash)
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
        web3.bzz.upload(fileContent)
          .then(resolve)
          .catch(reject);
      }).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

__embarkSwarm.getUrl = function (hash) {
  return `${this._config.getUrl || this._connectUrl + '/bzz:/'}${hash}`;
};

