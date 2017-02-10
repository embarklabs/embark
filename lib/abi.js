var Plugins = require('./plugins.js');

var ABIGenerator = function(options) {
  this.blockchainConfig = options.blockchainConfig || {};
  this.storageConfig = options.storageConfig || {};
  this.contractsManager = options.contractsManager;
  this.rpcHost = options.blockchainConfig && options.blockchainConfig.rpcHost;
  this.rpcPort = options.blockchainConfig && options.blockchainConfig.rpcPort;
  this.plugins = options.plugins || new Plugins({});
};

ABIGenerator.prototype.generateProvider = function() {
  var self = this;
  var result = "";

  var providerPlugins = this.plugins.getPluginsFor('clientWeb3Provider');

  if (providerPlugins.length > 0) {
    providerPlugins.forEach(function(plugin) {
      result += plugin.generateProvider(self) + "\n";
    });
  } else {
    result += "\nif (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {";
    result += '\n\tweb3 = new Web3(web3.currentProvider);';
    result += "\n} else if (typeof Web3 !== 'undefined') {";
    result += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("http://' + this.rpcHost + ':' + this.rpcPort + '"));';
    result += '\n}';
    result += "\nweb3.eth.defaultAccount = web3.eth.accounts[0];";
  }

  return result;
};

ABIGenerator.prototype.generateContracts = function(useEmbarkJS) {
  var self = this;
  var result = "\n";

  var contractsPlugins = this.plugins.getPluginsFor('contractGeneration');

  if (contractsPlugins.length > 0) {
    contractsPlugins.forEach(function(plugin) {
      result += plugin.generateContracts({contracts: self.contractsManager.contracts});
    });
  } else {
    for(var className in this.contractsManager.contracts) {
      var contract = this.contractsManager.contracts[className];

      var abi = JSON.stringify(contract.abiDefinition);
      var gasEstimates = JSON.stringify(contract.gasEstimates);

      if (useEmbarkJS) {
        result += "\n" + className + " = new EmbarkJS.Contract({abi: " + abi + ", address: '" + contract.deployedAddress + "', code: '" + contract.code + "', gasEstimates: " + gasEstimates + "});";
      } else {
        result += "\n" + className + "Abi = " + abi + ";";
        result += "\n" + className + "Contract = web3.eth.contract(" + className + "Abi);";
        result += "\n" + className + " = " + className + "Contract.at('" + contract.deployedAddress + "');";
      }
    }
  }

  return result;
};

ABIGenerator.prototype.generateStorageInitialiation = function(useEmbarkJS) {
  var self = this;
  var result = "\n";

  if (!useEmbarkJS || self.storageConfig === {}) return;

  if (self.storageConfig.provider === 'ipfs' && self.storageConfig.enabled === true) {
    result += "\n" + "EmbarkJS.Storage.setProvider('" + self.storageConfig.provider + "', {server: '" + self.storageConfig.host + "', port: '" + self.storageConfig.port + "'});";
  }

  return result;
};


ABIGenerator.prototype.generateABI = function(options) {
  var result = "";

  result += this.generateProvider();
  result += this.generateContracts(options.useEmbarkJS);
  result += this.generateStorageInitialiation(options.useEmbarkJS);

  return result;
};

module.exports = ABIGenerator;
