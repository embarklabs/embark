/*global Web3*/

const __embarkWeb3 = {};

__embarkWeb3.init = function (_config) {
  this.web3 = new Web3();
  global.web3 = this.web3;
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
  return this.web3.eth.sendTransaction(...arguments);
};

__embarkWeb3.toWei = function () {
  return this.web3.toWei(...arguments);
};


