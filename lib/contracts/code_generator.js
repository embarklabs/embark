let async = require('async');
let fs = require('../core/fs.js');

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
        result += Templates.vanilla_contract({className: className, abi: abi, contract: contract, gasLimit: 6000000});
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
          block += Templates.vanilla_contract({className: className, abi: abi, contract: contract, gasLimit: (isDeployment ? 6000000 : false)});
        }
        result += Templates.exec_when_ready({block: block});

      }
    }

    return result;
  }

  generateContractCode(contract, gasLimit) {
    let abi = JSON.stringify(contract.abiDefinition);

    let block = "";
    block += Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit});
    return block;
  }

  generateStorageInitialization(useEmbarkJS) {
    if (!useEmbarkJS || this.storageConfig === {}) return "";

    let result = "\n";
    result += Templates.define_when_env_loaded();
    result += this._getInitCode('storage', this.storageConfig);

    return result;
  }

  generateCommunicationInitialization(useEmbarkJS) {
    if (!useEmbarkJS || this.communicationConfig === {}) return "";

    let result = "\n";
    result += Templates.define_when_env_loaded();
    result += this._getInitCode('communication', this.communicationConfig);

    return result;
  }

  _getInitCode(codeType, config) {
    let result = "";
    let pluginsWithCode = this.plugins.getPluginsFor('initCode');
    for (let plugin of pluginsWithCode) {
      let initCodes = plugin.embarkjs_init_code[codeType] || [];
      for (let initCode of initCodes) {
        let [block, shouldInit] = initCode;
        if (shouldInit.call(plugin, config)) {
          result += Templates.exec_when_env_loaded({block: block});
        }
      }
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

  buildEmbarkJS(cb) {
    const self = this;
    let embarkjsCode = fs.readFileSync(fs.embarkPath('js/embark.js')).toString();
    let code = "";

    async.waterfall([
      function getWeb3Location(next) {
        self.events.request("version:get:web3", function(web3Version) {
          if (web3Version === "1.0.0-beta") {
            return next(null, fs.embarkPath("js/web3-1.0.min.js"));
          } else {
            self.events.request("version:getPackageLocation", "web3", web3Version, function(err, location) {
              return next(null, fs.dappPath(location));
            });
          }
        });
      },
      function getImports(web3Location, next) {
        web3Location = web3Location.replace(/\\/g, '/'); // Import paths must always have forward slashes
        code += "\nimport Web3 from '" + web3Location + "';\n";
        code += "\nimport web3 from 'Embark/web3';\n";
        next();
      },
      function getJSCode(next) {
        code += "\n" + embarkjsCode + "\n";
        let pluginsWithCode = self.plugins.getPluginsFor('embarkjsCode');
        for (let plugin of pluginsWithCode) {
          code += plugin.embarkjs_code.join('\n');
        }

        //code += "\n" + fs.readFileSync(fs.embarkPath('js/embarkjs/orbit.js')).toString();

        code += self.generateCommunicationInitialization(true);
        code += self.generateStorageInitialization(true);
        next();
      },
      function writeFile(next) {
        fs.mkdirpSync(fs.dappPath(".embark"));
        fs.writeFileSync(fs.dappPath(".embark", 'embark.js'), code);
        next();
      }
    ], function(_err, _result) {
      cb();
    });
  }
}

module.exports = CodeGenerator;
