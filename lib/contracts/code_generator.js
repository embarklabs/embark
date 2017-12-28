let fs = require('../core/fs.js');
var utils = require('../utils/utils.js');

require('ejs');
const Templates = {
  utils: require('./code_templates/utils.js.ejs'),
  vanilla_contract: require('./code_templates/vanilla-contract.js.ejs'),
  embarkjs_contract: require('./code_templates/embarkjs-contract.js.ejs'),
  exec_when_ready: require('./code_templates/exec-when-ready.js.ejs'),
  load_manager: require('./code_templates/load-manager.js.ejs'),
  define_when_env_loaded: require('./code_templates/define-when-env-loaded.js.ejs'),
  main_context: require('./code_templates/main-context.js.ejs'),
  define_web3_simple: require('./code_templates/define-web3-simple.js.ejs'),
  web3_connector: require('./code_templates/web3-connector.js.ejs'),
  do_when_loaded: require('./code_templates/do-when-loaded.js.ejs'),
  exec_when_env_loaded: require('./code_templates/exec-when-env-loaded.js.ejs')
};

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

    this.events.setCommandHandlerOnce('provider-code', function(cb) {
      let providerCode = self.generateProvider(false);

      cb(providerCode);
    });

    // deprecated events; to remove in embark 2.7.0
    this.events.setCommandHandlerOnce('abi-vanila', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('abi', function(cb) {
      let embarkJSABI = self.generateABI({useEmbarkJS: true});
      let contractsJSON = self.generateContractsJSON();

      cb(embarkJSABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('abi-contracts-vanila', function(cb) {
      let vanillaContractsABI = self.generateContracts(false, true, false);
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaContractsABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('abi-vanila-deployment', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false, deployment: true});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });

    // new events
    this.events.setCommandHandlerOnce('code-vanila', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('code', function(cb) {
      let embarkJSABI = self.generateABI({useEmbarkJS: true});
      let contractsJSON = self.generateContractsJSON();

      cb(embarkJSABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('code-contracts-vanila', function(cb) {
      let vanillaContractsABI = self.generateContracts(false, true, false);
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaContractsABI, contractsJSON);
    });

    this.events.setCommandHandlerOnce('code-vanila-deployment', function(cb) {
      let vanillaABI = self.generateABI({useEmbarkJS: false, deployment: true});
      let contractsJSON = self.generateContractsJSON();

      cb(vanillaABI, contractsJSON);
    });

  }

  generateContext() {
    let result = "";
    result += Templates.main_context();
    result += Templates.load_manager();
    return result;
  }

  generateProvider(isDeployment) {
    let self = this;
    let result = "";
    let providerPlugins;

    // TODO: check contractsConfig for enabled
    if (self.blockchainConfig === {} || self.blockchainConfig.enabled === false) {
      return "";
    }

    result += Templates.utils();

    result += Templates.main_context();
    result += Templates.load_manager();
    result += Templates.define_when_env_loaded();

    if (this.plugins) {
      providerPlugins = this.plugins.getPluginsFor('clientWeb3Provider');
    }

    if (this.plugins && providerPlugins.length > 0) {
      providerPlugins.forEach(function(plugin) {
        result += plugin.generateProvider(self) + "\n";
      });
    } else {

      let web3Load;

      if (isDeployment) {
        let connection = "http://" + this.contractsConfig.deployment.host + ":" + this.contractsConfig.deployment.port;
        web3Load = Templates.define_web3_simple({url: connection, done: 'done();'});
      } else {
        let connectionList = "[" + this.contractsConfig.dappConnection.map((x) => '"' + x + '"').join(',') + "]";
        web3Load = Templates.web3_connector({connectionList: connectionList, done: 'done();'});
      }

      result += Templates.do_when_loaded({block: web3Load});
    }

    return result;
  }

  generateContracts(useEmbarkJS, isDeployment, useLoader) {
    let self = this;
    let result = "\n";
    let contractsPlugins;

    if (useLoader === false) {
      for (let className in this.contractsManager.contracts) {
        let contract = this.contractsManager.contracts[className];
        let abi = JSON.stringify(contract.abiDefinition);
        result += Templates.vanilla_contract({className: className, abi: abi, contract: contract});
      }
      return result;
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

        let block = "";

        if (useEmbarkJS) {
           let contractAddress = contract.deployedAddress ? ("'" + contract.deployedAddress + "'") : "undefined";
          block += Templates.embarkjs_contract({className: className, abi: abi, contract: contract, contractAddress: contractAddress, gasEstimates: gasEstimates});
        } else {
          block += Templates.vanilla_contract({className: className, abi: abi, contract: contract});
        }
        result += Templates.exec_when_ready({block: block});

      }
    }

    return result;
  }

  generateContractCode(contract) {
    let abi = JSON.stringify(contract.abiDefinition);

    let block = "";
    block += Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract});
    return block;
  }

  generateStorageInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.storageConfig === {}) return "";

    result += Templates.define_when_env_loaded();

    let pluginsWithCode = this.plugins.getPluginsFor('initCode');
    if (pluginsWithCode.length > 0) {
      for (let plugin of pluginsWithCode) {
        let initCodes = plugin.embarkjs_init_code.storage;
        for (let initCode of initCodes) {
          let [block, shouldInit] = initCode;
          if (shouldInit.call(plugin, self.storageConfig)) {
            result += Templates.exec_when_env_loaded({block: block});
          }
        }
      }
    }

    return result;
  }

  generateCommunicationInitialization(useEmbarkJS) {
    let self = this;
    let result = "\n";

    if (!useEmbarkJS || self.communicationConfig === {}) return "";

    // TODO: don't repeat this twice; should have 'requirements' generator first
    result += Templates.define_when_env_loaded();

    let block;
    //if (self.communicationConfig.enabled === true && ['whisper', 'orbit'].indexOf(self.communicationConfig.provider) < 0) {
    //  //TODO: add logger; also make sure it would still work with a plugin provider
    //  self.logger.warn("unknown provider " + self.communicationConfig.provider);
    //}
    // TODO: refactor this
    if (self.communicationConfig.enabled === true) {
      if (self.communicationConfig.connection === undefined) {
        block = "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "');";
      } else {
        block = "\nEmbarkJS.Messages.setProvider('" + self.communicationConfig.provider + "', {server: '" + self.communicationConfig.connection.host + "', port: '" + self.communicationConfig.connection.port + "', type: '" + self.communicationConfig.connection.type + "'});";
      }
      result += Templates.exec_when_env_loaded({block: block});
    }
    return result;
  }

  generateABI(options) {
    let result = "";

    result += this.generateProvider(options.deployment);
    result += this.generateContracts(options.useEmbarkJS, options.deployment, true);
    result += this.generateStorageInitialization(options.useEmbarkJS);
    result += this.generateCommunicationInitialization(options.useEmbarkJS);

    return result;
  }

  generateContractsJSON() {
    let contracts = {};

    for (let className in this.contractsManager.contracts) {
      let contract = this.contractsManager.contracts[className];
      let contractJSON = {};

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

  buildEmbarkJS() {
    let embarkjsCode = fs.readFileSync(fs.embarkPath('js/embark.js')).toString();
    let code = "";

    code += "\nimport Web3 from '" + utils.joinPath(fs.embarkPath("js/web3-1.0.min.js")) + "'\n";
    code += "\nimport web3 from 'Embark/web3';\n";

    code += "\n" + embarkjsCode + "\n";

    let pluginsWithCode = this.plugins.getPluginsFor('embarkjsCode');
    if (pluginsWithCode.length > 0) {
      for (let plugin of pluginsWithCode) {
        code += plugin.embarkjs_code.join('\n');
      }
    }

    //code += "\n" + fs.readFileSync(fs.embarkPath('js/embarkjs/orbit.js')).toString();

    code += this.generateCommunicationInitialization(true);
    code += this.generateStorageInitialization(true);

    let filePath = utils.joinPath(fs.dappPath(), ".embark", 'embark.js');
    fs.mkdirpSync(utils.joinPath(fs.dappPath(), ".embark"));
    fs.writeFileSync(filePath, code);
  }
}

module.exports = CodeGenerator;
