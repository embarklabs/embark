const Web3 = require('web3');
const __embarkWeb3 = {};

__embarkWeb3.init = function(config) {
  global.web3 = config.web3 || global.web3;
  // Check if the global web3 object uses the old web3 (0.x)
  if (global.web3 && typeof global.web3.version !== 'string') {
    // If so, use a new instance using 1.0, but use its provider
    this.web3 = new Web3(global.web3.currentProvider);
  } else {
    this.web3 = global.web3 || new Web3();
  }
  global.web3 = this.web3;
};

__embarkWeb3.getInstance = function () {
  return this.web3;
};

__embarkWeb3.getAccounts = function () {
  return this.web3.eth.getAccounts(...arguments);
};

__embarkWeb3.getNewProvider = function (providerName, ...args) {
  return new Web3.providers[providerName](...args);
};

__embarkWeb3.setProvider = function (provider) {
  return this.web3.setProvider(provider);
};

__embarkWeb3.getCurrentProvider = function () {
  return this.web3.currentProvider;
};

__embarkWeb3.getDefaultAccount = function () {
  return this.web3.eth.defaultAccount;
};

__embarkWeb3.setDefaultAccount = function (account) {
  this.web3.eth.defaultAccount = account;
};

__embarkWeb3.newContract = function (options) {
  return new this.web3.eth.Contract(options.abi, options.address);
};

__embarkWeb3.send = function () {
  console.log('ARGUEMTNS', ...arguments);
  return this.web3.eth.sendTransaction(...arguments);
};

__embarkWeb3.toWei = function () {
  return this.web3.utils.toWei(...arguments);
};

__embarkWeb3.getNetworkId = function () {
  return this.web3.eth.net.getId();
};

export default __embarkWeb3;
