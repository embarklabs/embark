/*global web3 */
let __embarkSwarm = {};
const bytes = require("eth-lib/lib/bytes");

__embarkSwarm.setProvider = function (options) {
  this.bzz = web3.bzz;
  this.protocol = options.protocol;
  this.host = options.host;
  this.port = options.port;
  this.connectUrl = `${options.protocol}://${options.host}:${options.port}`;
  this.connectError = new Error(`Cannot connect to Swarm node on ${this.connectUrl}`);
  this._getUrl = options.getUrl || `${this.connectUrl}/bzzr:/`;

  return new Promise((resolve, reject) => {
    try {
      if (!this.bzz.currentProvider) {
        this.bzz.setProvider(`${options.protocol}://${options.host}:${options.port}`);
      }
      resolve(this);
    } catch (err) {
      console.log(err);
      reject(this.connectError);
    }
  });
};

__embarkSwarm.isAvailable = function () {
  return new Promise((resolve, reject) => {
    if (!this.bzz) {
      return resolve(false);
    }
    this.bzz.isAvailable()
      .then(resolve)
      .catch(() => {
        reject(this.connectError);
      });
  });
};

__embarkSwarm.saveText = function (text) {
  return new Promise((resolve, reject) => {
    this.isAvailable().then((isAvailable) => {
      if (!isAvailable) {
        return reject(this.connectError);
      }
      this.bzz.upload(text)
        .then(resolve)
        .catch(reject);
    }).catch(reject);
  });
};

__embarkSwarm.get = function (hash) {
  return new Promise((resolve, reject) => {
    this.isAvailable().then((isAvailable) => {
      if (!isAvailable) {
        return reject(this.connectError);
      }
      this.bzz.download(hash)
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
          return reject(this.connectError);
        }
        this.bzz.upload(fileContent)
          .then(resolve)
          .catch(reject);
      }).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

__embarkSwarm.getUrl = function (hash) {
  return this._getUrl + hash;
};

