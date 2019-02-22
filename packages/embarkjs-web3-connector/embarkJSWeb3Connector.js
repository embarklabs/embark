/*global Web3*/
const embarkJSWeb3Connector = {};

embarkJSWeb3Connector.init = function(config) {
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

embarkJSWeb3Connector.getInstance = function () {
  return this.web3;
};

embarkJSWeb3Connector.getAccounts = function () {
  return this.web3.eth.getAccounts(...arguments);
};

embarkJSWeb3Connector.getNewProvider = function (providerName, ...args) {
  return new Web3.providers[providerName](...args);
};

embarkJSWeb3Connector.setProvider = function (provider) {
  return this.web3.setProvider(provider);
};

embarkJSWeb3Connector.getCurrentProvider = function () {
  return this.web3.currentProvider;
};

embarkJSWeb3Connector.getDefaultAccount = function () {
  return this.web3.eth.defaultAccount;
};

embarkJSWeb3Connector.setDefaultAccount = function (account) {
  this.web3.eth.defaultAccount = account;
};

embarkJSWeb3Connector.newContract = function (options) {
  return new this.web3.eth.Contract(options.abi, options.address);
};

embarkJSWeb3Connector.send = function () {
  return this.web3.eth.sendTransaction(...arguments);
};

embarkJSWeb3Connector.toWei = function () {
  return this.web3.toWei(...arguments);
};

embarkJSWeb3Connector.getNetworkId = function () {
  return this.web3.eth.net.getId();
};
