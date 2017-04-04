class ABIGenerator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig || {};
    this.storageConfig = options.storageConfig || {};
    this.communicationConfig = options.communicationConfig || {};
    this.contractsManager = options.contractsManager;
    this.rpcHost = options.blockchainConfig && options.blockchainConfig.rpcHost;
    this.rpcPort = options.blockchainConfig && options.blockchainConfig.rpcPort;
    this.plugins = options.plugins;
  }

  generateProvider() {
    let self = this;
    let result = "";
    let providerPlugins;

    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      return "";
    }

    if (this.plugins) {
      providerPlugins = this.plugins.getPluginsFor('clientWeb3Provider');
    }

    if (this.plugins && providerPlugins.length > 0) {
      providerPlugins.forEach(function (plugin) {
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
  }

  generateContracts(useEmbarkJS) {
    let self = this;
    let result = "\n";
    let contractsPlugins;

    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      return "";
    }

    if (this.plugins) {
      contractsPlugins = this.plugins.getPluginsFor('contractGeneration');
    }

    if (this.plugins && contractsPlugins.length > 0) {
      contractsPlugins.forEach(function (plugin) {
        result += plugin.generateContracts({contracts: self.contractsManager.contracts});
      });
    } else {
      for (let className in this.contractsManager.contracts) {
        let contract = this.contractsManager.contracts[className];

        let abi = JSON.stringify(contract.abiDefinition);
        let gasEstimates = JSON.stringify(contract.gasEstimates);

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
  }

  generateStorageInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.storageConfig === {}) return "";

    if (self.storageConfig.provider === 'ipfs' && self.storageConfig.enabled === true) {
      result += "\nEmbarkJS.Storage.setProvider('" + self.storageConfig.provider + "', {server: '" + self.storageConfig.host + "', port: '" + self.storageConfig.port + "'});";
    }

    return result;
  }

  generateCommunicationInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.communicationConfig === {}) return "";

    if (self.communicationConfig.provider === 'whisper' && self.communicationConfig.enabled === true) {
      result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "');";
    } else if (self.communicationConfig.provider === 'orbit' && self.communicationConfig.enabled === true) {
      result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "', {server: '" + self.communicationConfig.host + "', port: '" + self.communicationConfig.port + "'});";
    }

    return result;
  }

  generateABI(options) {
    let result = "";

    result += this.generateProvider();
    result += this.generateContracts(options.useEmbarkJS);
    result += this.generateStorageInitialization(options.useEmbarkJS);
    result += this.generateCommunicationInitialization(options.useEmbarkJS);

    return result;
  }

  generateContractsJSON() {
    let contracts = {};

    for (let className in this.contractsManager.contracts) {
      let contract = this.contractsManager.contracts[className];
      let contractJSON = {};

      let abi = JSON.stringify(contract.abiDefinition);
      let gasEstimates = JSON.stringify(contract.gasEstimates);

      contractJSON.contract_name = className;
      contractJSON.code = contract.code;
      contractJSON.runtime_bytecode = contract.runtimeBytecode;
      contractJSON.real_runtime_bytecode = contract.realRuntimeBytecode;
      contractJSON.swarm_hash = contract.swarmHash;
      contractJSON.gas_estimates = contract.gasEstimates;
      contractJSON.function_hashes = contract.functionHashes;
      contractJSON.abi = contract.abiDefinition;

      contracts[className] = contractJSON;
    }

    return contracts;
  }
}

module.exports = ABIGenerator;
