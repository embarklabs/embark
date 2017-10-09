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
      let vanillaContractsABI = self.generateContracts(false, true);
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

    result += "\nfunction __reduce(arr, memo, iteratee, cb) {";
    result += "\n  if (typeof cb !== 'function') {";
    result += "\n    if (typeof memo === 'function' && typeof iteratee === 'function') {";
    result += "\n      cb = iteratee;";
    result += "\n      iteratee = memo;";
    result += "\n      memo = [];";
    result += "\n    } else {";
    result += "\n      throw new TypeError('expected callback to be a function');";
    result += "\n    }";
    result += "\n  }";
result += "\n";
    result += "\n  if (!Array.isArray(arr)) {";
    result += "\n    cb(new TypeError('expected an array'));";
    result += "\n    return;";
    result += "\n  }";
result += "\n";
    result += "\n  if (typeof iteratee !== 'function') {";
    result += "\n    cb(new TypeError('expected iteratee to be a function'));";
    result += "\n    return;";
    result += "\n  }";
result += "\n";
    result += "\n  (function next(i, acc) {";
    result += "\n    if (i === arr.length) {";
    result += "\n      cb(null, acc);";
    result += "\n      return;";
    result += "\n    }";
result += "\n";
    result += "\n    iteratee(acc, arr[i], function(err, val) {";
    result += "\n      if (err) {";
    result += "\n        cb(err);";
    result += "\n        return;";
    result += "\n      }";
    result += "\n      next(i + 1, val);";
    result += "\n    });";
    result += "\n  })(0, memo);";
    result += "\n};";

    let mainContext = "";
    if (isDeployment) {
      mainContext = "__mainContext.";
      result += "\nvar __mainContext = __mainContext || this;";
    } else {
      result += "\nvar __mainContext = __mainContext || this;";
      mainContext = "__mainContext.";
    }

    result += "\n" + mainContext + "__LoadManager = function() { this.list = []; this.done = false; }";
    result += "\n" + mainContext + "__LoadManager.prototype.execWhenReady = function(cb) { if (this.done) { cb(); } else { this.list.push(cb) } }";
    result += "\n" + mainContext + "__LoadManager.prototype.doFirst = function(todo) { var self = this; todo(function() { self.done = true; self.list.map((x) => x.apply()) }) }";
    result += "\n" + mainContext + "__loadManagerInstance = new " + mainContext + "__LoadManager();";

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
      result += "\nwhenEnvIsLoaded(function(){" + mainContext + "__loadManagerInstance.doFirst(function(done) {\n";

      result += "\nif (typeof window !== 'undefined') { window.web3 = undefined; }";

      if (isDeployment) {
        let connection = "http://" + this.contractsConfig.deployment.host + ":" + this.contractsConfig.deployment.port;
        result += '\n\tweb3 = new Web3(new Web3.providers.HttpProvider("' + connection + '"));';
        result += '\n\tdone();';
      } else {

        let connectionCode = "";
        connectionCode += "\n__reduce([";
        connectionCode += this.contractsConfig.dappConnection.map((x) => '"' + x + '"').join(',');
        connectionCode += "], function(prev, value, next) {";

        connectionCode += "\nif (prev === false) {";
        connectionCode += "\n  return next(null, false);";
        connectionCode += "\n}";

        connectionCode += "\n if (value === '$WEB3' && (typeof web3 !== 'undefined' && typeof Web3 !== 'undefined')) {";
        connectionCode += '\n\tweb3 = new Web3(web3.currentProvider);';
        connectionCode += "\n } else if (value !== '$WEB3' && (typeof Web3 !== 'undefined' && ((typeof web3 === 'undefined') || (typeof web3 !== 'undefined' && (!web3.isConnected || (web3.isConnected && !web3.isConnected())))))) {";

        connectionCode += "\n\tweb3 = new Web3(new Web3.providers.HttpProvider(value));"

        connectionCode += "\n}";

        connectionCode += "\nelse if (value === '$WEB3') {";
        connectionCode += "\n\treturn next(null, '');";
        connectionCode += "\n}";

        connectionCode += "\nweb3.eth.getAccounts(function(err, account) { if(err) { next(null, true) } else { next(null, false) }})";

        connectionCode += "\n}, function(err, _result) {";
        connectionCode += "\nweb3.eth.getAccounts(function(err, accounts) {;";
        connectionCode += "\nweb3.eth.defaultAccount = accounts[0];";
        connectionCode += '\ndone();';
        connectionCode += "\n});";
        connectionCode += "\n});";

        result += connectionCode;
      }

      result += '\n})})';
    }

    return result;
  }

  generateContracts(useEmbarkJS, isDeployment) {
    let self = this;
    let result = "\n";
    let contractsPlugins;

    let mainContext = "";
    if (isDeployment) {
      mainContext = "__mainContext.";
    } else {
      mainContext = "__mainContext.";
    }

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
        //result += "\nif (whenEnvIsLoaded === undefined) {";
        //result += "\n  var whenEnvIsLoaded = function(cb) {";
        //result += "\n    if (typeof document !== 'undefined' && document !== null) {";
        //result += "\n        document.addEventListener('DOMContentLoaded', cb);";
        //result += "\n    } else {";
        //result += "\n      cb();";
        //result += "\n    }";
        //result += "\n  }";
        //result += "\n}";

        result += "\n" + mainContext + "__loadManagerInstance.execWhenReady(function() {";
        result += "\nif (typeof window !== 'undefined') { window." + className + " = undefined; }";
        if (useEmbarkJS) {
           let contractAddress = contract.deployedAddress ? ("'" + contract.deployedAddress + "'") : "undefined";
          result += "\n" + mainContext + "" + className + " = new EmbarkJS.Contract({abi: " + abi + ", address: " + contractAddress + ", code: '" + contract.code + "', gasEstimates: " + gasEstimates + "});";
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
    result += this.generateContracts(options.useEmbarkJS, options.deployment);
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
