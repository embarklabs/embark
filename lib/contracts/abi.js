
var ABIGenerator = function(options) {
  this.blockchainConfig = options.blockchainConfig || {};
  this.storageConfig = options.storageConfig || {};
  this.communicationConfig = options.communicationConfig || {};
  this.contractsManager = options.contractsManager;
  this.rpcHost = options.blockchainConfig && options.blockchainConfig.rpcHost;
  this.rpcPort = options.blockchainConfig && options.blockchainConfig.rpcPort;
  this.plugins = options.plugins;
};

ABIGenerator.prototype.generateProvider = function() {
  var self = this;
  var result = "";
  var providerPlugins;

  if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
    return "";
  }

  result += "\nvar whenEnvIsLoaded = function(cb) {";
  result += "\n  if (typeof window !== 'undefined' && window !== null) {";
  result += "\n      window.addEventListener('load', cb);";
  result += "\n  } else {";
  result += "\n    cb();";
  result += "\n  }";
  result += "\n}";

  if (this.plugins) {
    providerPlugins = this.plugins.getPluginsFor('clientWeb3Provider');
  }

  if (this.plugins && providerPlugins.length > 0) {
    providerPlugins.forEach(function(plugin) {
      result += plugin.generateProvider(self) + "\n";
    });
  } else {
    result += "\nwhenEnvIsLoaded(function() {";
    result += "\nif (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {";
    result += '\n\tweb3 = new Web3(web3.currentProvider);';
    result += "\n} else if (typeof Web3 !== 'undefined') {";
    result += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("http://' + this.rpcHost + ':' + this.rpcPort + '"));';
    result += '\n}';
    result += "\nweb3.eth.defaultAccount = web3.eth.accounts[0];";
    result += '\n})';
  }

  return result;
};

ABIGenerator.prototype.generateContracts = function(useEmbarkJS) {
  var self = this;
  var result = "\n";
  var contractsPlugins;

  if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
    return "";
  }

  if (this.plugins) {
    contractsPlugins = this.plugins.getPluginsFor('contractGeneration');
  }

  if (this.plugins && contractsPlugins.length > 0) {
    contractsPlugins.forEach(function(plugin) {
      result += plugin.generateContracts({contracts: self.contractsManager.contracts});
    });
  } else {
    for(var className in this.contractsManager.contracts) {
      var contract = this.contractsManager.contracts[className];

      var abi = JSON.stringify(contract.abiDefinition);
      var gasEstimates = JSON.stringify(contract.gasEstimates);

      // TODO: refactor this
      result += "\nvar whenEnvIsLoaded = function(cb) {";
      result += "\n  if (typeof window !== 'undefined' && window !== null) {";
      result += "\n      window.addEventListener('load', cb);";
      result += "\n  } else {";
      result += "\n    cb();";
      result += "\n  }";
      result += "\n}";

      result += "\nwhenEnvIsLoaded(function() {";
      if (useEmbarkJS) {
        result += "\n" + className + " = new EmbarkJS.Contract({abi: " + abi + ", address: '" + contract.deployedAddress + "', code: '" + contract.code + "', gasEstimates: " + gasEstimates + "});";
      } else {
        result += "\n" + className + "Abi = " + abi + ";";
        result += "\n" + className + "Contract = web3.eth.contract(" + className + "Abi);";
        result += "\n" + className + " = " + className + "Contract.at('" + contract.deployedAddress + "');";
      }
      result += '\n});';
    }
  }

  return result;
};

ABIGenerator.prototype.generateStorageInitialization = function(useEmbarkJS) {
  var self = this;
  var result = "\n";

  if (!useEmbarkJS || self.storageConfig === {}) return "";

  if (self.storageConfig.provider === 'ipfs' && self.storageConfig.enabled === true) {
    result += "\nEmbarkJS.Storage.setProvider('" + self.storageConfig.provider + "', {server: '" + self.storageConfig.host + "', port: '" + self.storageConfig.port + "'});";
  }

  return result;
};

ABIGenerator.prototype.generateCommunicationInitialization = function(useEmbarkJS) {
  var self = this;
  var result = "\n";

  if (!useEmbarkJS || self.communicationConfig === {}) return "";

  if (self.communicationConfig.provider === 'whisper' && self.communicationConfig.enabled === true) {
    result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "');";
  } else if (self.communicationConfig.provider === 'orbit' && self.communicationConfig.enabled === true) {
    result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "', {server: '" + self.communicationConfig.host + "', port: '" + self.communicationConfig.port + "'});";
  }

  return result;
};

ABIGenerator.prototype.generateABI = function(options) {
  var result = "";

  result += this.generateProvider();
  result += this.generateContracts(options.useEmbarkJS);
  result += this.generateStorageInitialization(options.useEmbarkJS);
  result += this.generateCommunicationInitialization(options.useEmbarkJS);

  return result;
};

module.exports = ABIGenerator;
