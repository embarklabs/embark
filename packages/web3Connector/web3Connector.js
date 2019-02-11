const Web3 = require('web3');

const web3Connector = {};
// const _web3 = require('./web3_instance').default;
// global.wtf = _web3;

web3Connector.init = function(_config) {
  // Check if the global web3 object uses the old web3 (0.x)
  if (global.web3 && typeof global.web3.version !== 'string') {
    // If so, use a new instance using 1.0, but use its provider
    // _web3.setProvider(global.web3.currentProvider);
    this.web3 = new Web3(global.web3.currentProvider);
  } else {
    this.web3 = global.web3 || new Web3();
  }
  global.web3 = this.web3;
};

web3Connector.getInstance = function () {
  return this.web3;
};

web3Connector.getAccounts = function () {
  return this.web3.eth.getAccounts(...arguments);
};

web3Connector.getNewProvider = function (providerName, ...args) {
  return new Web3.providers[providerName](...args);
};

web3Connector.setProvider = function (provider) {
  // _web3.setProvider(provider);
  return this.web3.setProvider(provider);
};

web3Connector.getCurrentProvider = function () {
  return this.web3.currentProvider;
};

web3Connector.getDefaultAccount = function () {
  return this.web3.eth.defaultAccount;
};

web3Connector.setDefaultAccount = function (account) {
  this.web3.eth.defaultAccount = account;
};

web3Connector.newContract = function (options) {
  return new this.web3.eth.Contract(options.abi, options.address);
};

web3Connector.send = function () {
  return this.web3.eth.sendTransaction(...arguments);
};

web3Connector.toWei = function () {
  return this.web3.toWei(...arguments);
};

web3Connector.getNetworkId = function () {
  return this.web3.eth.net.getId();
};

module.exports = web3Connector;
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = web3Connector;
//   return;
// } else {
//   export default web3Connector;
// }
// exports.default = web3Connector;
