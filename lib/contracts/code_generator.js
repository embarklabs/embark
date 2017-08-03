class CodeGenerator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig || {};
    this.contractsConfig = options.contractsConfig || {};
    this.storageConfig = options.storageConfig || {};
    this.communicationConfig = options.communicationConfig || {};
    this.contractsManager = options.contractsManager;
    this.plugins = options.plugins;
    this.events = options.events;
  }

  listenToCommands() {
    let self = this;

    this.events.setCommandHandler('abi-vanila', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });

    this.events.setCommandHandler('abi', function(cb) {
      let embarkJSABI = self.generateABI({useEmbarkJS: true});
      let contractsJSON = self.generateContractsJSON();

      cb(embarkJSABI, contractsJSON);
    });

    this.events.setCommandHandler('abi-contracts-vanila', function(cb) {
      let vanillaContractsABI = self.generateContracts(false);
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaContractsABI, contractsJSON);
    });

    this.events.setCommandHandler('abi-vanila-deployment', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false, deployment: true});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });
  }

  generateProvider(isDeployment) {
    let self = this;
    let result = "";
    let providerPlugins;

    // TODO: check contractsConfig for enabled
    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      return "";
    }

    result += "\nvar whenEnvIsLoaded = function(cb) {";
    result += "\n  if (typeof document !== 'undefined' && document !== null) {";
    result += "\n      document.addEventListener('DOMContentLoaded', cb);";
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
      result += "\nwhenEnvIsLoaded(function() {\n";

      if (isDeployment) {

        let connection = "http://" + this.contractsConfig.deployment.host + ":" + this.contractsConfig.deployment.port;
        result += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("' + connection + '"));';
      } else {

        let connectionCode = this.contractsConfig.dappConnection.map(function(connection) {
          let code = "";
          if (connection === '$WEB3') {
            code += "if (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {";
            code += '\n\tweb3 = new Web3(web3.currentProvider);';
            code += '\n}';
          } else {
            code += "if (typeof Web3 !== 'undefined' && ((typeof web3 === 'undefined') || (typeof web3 !== 'undefined' && !web3.isConnected()))) {";
            code += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("' + connection + '"));';
            code += '\n}';
          }
          return code;
        });

        result += connectionCode.join(' ');
      }


      result += "\nweb3.eth.defaultAccount = web3.eth.accounts[0];";
      result += '\n})';
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

        // TODO: refactor this
        result += "\nif (whenEnvIsLoaded === undefined) {";
        result += "\n  var whenEnvIsLoaded = function(cb) {";
        result += "\n    if (typeof document !== 'undefined' && document !== null) {";
        result += "\n        document.addEventListener('DOMContentLoaded', cb);";
        result += "\n    } else {";
        result += "\n      cb();";
        result += "\n    }";
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
  }

  generateStorageInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.storageConfig === {}) return "";

    if (self.storageConfig.provider === 'ipfs' && self.storageConfig.enabled === true) {
      // TODO: make this more readable

      result += "\nvar whenEnvIsLoaded = function(cb) {";
      result += "\n  if (typeof document !== 'undefined' && document !== null) {";
      result += "\n      document.addEventListener('DOMContentLoaded', cb);";
      result += "\n  } else {";
      result += "\n    cb();";
      result += "\n  }";
      result += "\n}";

      result += "\nwhenEnvIsLoaded(function() {\n";
      result += "\nEmbarkJS.Storage.setProvider('" + self.storageConfig.provider + "', {server: '" + self.storageConfig.host + "', port: '" + self.storageConfig.port + "', getUrl: '" + self.storageConfig.getUrl + "'});";
      result += '\n})';
    }

    return result;
  }

  generateCommunicationInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.communicationConfig === {}) return "";

    result += "\nvar whenEnvIsLoaded = function(cb) {";
    result += "\n  if (typeof document !== 'undefined' && document !== null) {";
    result += "\n      document.addEventListener('DOMContentLoaded', cb);";
    result += "\n  } else {";
    result += "\n    cb();";
    result += "\n  }";
    result += "\n}";

    if (self.communicationConfig.provider === 'whisper' && self.communicationConfig.enabled === true) {
      result += "\nwhenEnvIsLoaded(function() {\n";
      result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "');";
      result += '\n})';
    } else if (self.communicationConfig.provider === 'orbit' && self.communicationConfig.enabled === true) {
      result += "\nwhenEnvIsLoaded(function() {\n";
      if (self.communicationConfig.host === undefined && self.communicationConfig.port === undefined) {
        result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "');";
      } else {
        result += "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "', {server: '" + self.communicationConfig.host + "', port: '" + self.communicationConfig.port + "'});";
      }
      result += '\n})';
    }

    return result;
  }

  generateABI(options) {
    let result = "";

    result += this.generateProvider(options.deployment);
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
      contractJSON.address = contract.deployedAddress;
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

module.exports = CodeGenerator;
