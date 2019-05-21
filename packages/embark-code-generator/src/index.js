import { __ } from 'embark-i18n';
import { dappPath, embarkPath, joinPath } from 'embark-utils';
import * as fs from 'fs-extra';
import { transform } from "@babel/core";
const async = require('async');
const constants = require('embark-core/constants');
const path  = require('path');

require('ejs');
const Templates = {
  vanilla_contract: require('./code_templates/vanilla-contract.js.ejs'),
  embarkjs_contract: require('./code_templates/embarkjs-contract.js.ejs'),
  exec_when_ready: require('./code_templates/exec-when-ready.js.ejs'),
  load_manager: require('./code_templates/load-manager.js.ejs'),
  define_when_env_loaded: require('./code_templates/define-when-env-loaded.js.ejs'),
  main_context: require('./code_templates/main-context.js.ejs'),
  do_when_loaded: require('./code_templates/do-when-loaded.js.ejs'),
  exec_when_env_loaded: require('./code_templates/exec-when-env-loaded.js.ejs')
};

class CodeGenerator {
  constructor(embark, options) {
    this.ready = false;
    this.blockchainConfig = embark.config.blockchainConfig || {};
    this.embarkConfig = embark.config.embarkConfig;
    this.dappConfigs = {};
    this.logger = embark.logger;
    this.rpcHost = this.blockchainConfig.rpcHost || '';
    this.rpcPort = this.blockchainConfig.rpcPort || '';
    this.contractsConfig = embark.config.contractsConfig || {};
    this.storageConfig = embark.config.storageConfig || {};
    this.communicationConfig = embark.config.communicationConfig || {};
    this.namesystemConfig = embark.config.namesystemConfig || {};
    this.webServerConfig = embark.config.webServerConfig || {};
    this.env = options.env || 'development';
    this.plugins = options.plugins;
    this.events = embark.events;

    this.listenToCommands();
    this.ready = true;
    this.events.emit('code-generator:ready');
  }

  listenToCommands() {
    this.events.on('config:load:contracts', this.generateContractConfig.bind(this));
    this.events.on('config:load:storage', this.generateStorageConfig.bind(this));
    this.events.on('config:load:communication', this.generateCommunicationConfig.bind(this));

    this.events.setCommandHandler('code', (cb) => {
      this.events.request("contracts:list", (_err, contractsList) => {
        let embarkJSABI = this.generateABI(contractsList, {useEmbarkJS: true});
        let contractsJSON = this.generateContractsJSON(contractsList);
        cb(embarkJSABI, contractsJSON);
      });
    });

    this.events.setCommandHandler('code-generator:contract', (contractName, cb) => {
      this.events.request('contracts:contract', contractName, (contract) => {
        this.buildContractJS(contractName, this.generateContractJSON(contract, contract), cb);
      });
    });

    this.events.setCommandHandler('code-generator:contract:vanilla', (contract, gasLimit, cb) => {
      cb(this.generateContractCode(contract, gasLimit));
    });

    this.events.setCommandHandler('code-generator:contract:custom', (contract, cb) => {
      const customCode = this.generateCustomContractCode(contract);
      if (!customCode) {
        // Fallback to generate code from vanilla contract generator.
        //
        // TODO: can be moved into a afterDeploy event
        // just need to figure out the gasLimit coupling issue
        return cb(this.generateContractCode(contract, contract._gasLimit || false));
      }
      cb(customCode);
    });

    this.events.setCommandHandler('code-generator:embarkjs:provider-code', (cb) => {
      cb(this.getEmbarkJsProviderCode());
    });

    this.events.setCommandHandler('code-generator:embarkjs:init-provider-code', (cb) => {
      cb(this.getInitProviderCode());
    });

    this.events.setCommandHandler('code-generator:symlink:generate', (...args) => {
      this.generateSymlink(...args);
    });

    this.events.setCommandHandler("code-generator:embarkjs:build", (cb) => {
      this.buildEmbarkJS(cb);
    });

    this.events.setCommandHandler('code-generator:ready', (cb) => {
      if (this.ready) {
        return cb();
      }
      this.events.once('code-generator:ready', cb);
    });
  }

  generateContracts(contractsList, useEmbarkJS, isDeployment, useLoader) {
    let self = this;
    let result = "\n";
    let contractsPlugins;

    if (useLoader === false) {
      for (let contract of contractsList) {
        let abi = JSON.stringify(contract.abiDefinition);
        result += Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract, gasLimit: constants.codeGenerator.gasLimit});
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
        result += plugin.generateContracts({contracts: contractsList});
      });
    } else {
      for (let contract of contractsList) {
        let abi = JSON.stringify(contract.abiDefinition);
        let gasEstimates = JSON.stringify(contract.gasEstimates);

        let block = "";

        if (useEmbarkJS) {
           let contractAddress = contract.deployedAddress ? ("'" + contract.deployedAddress + "'") : "undefined";
          block += Templates.embarkjs_contract({className: contract.className, abi: abi, contract: contract, contractAddress: contractAddress, gasEstimates: gasEstimates});
        } else {
          block += Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract, gasLimit: (isDeployment ? constants.codeGenerator.gasLimit : false)});
        }
        result += Templates.exec_when_ready({block: block});

      }
    }

    return result;
  }

  checkIfNeedsUpdate(file, newOutput, callback) {
    fs.readFile(file, (err, content) => {
      if (err) {
        return callback(null, true);
      }
      callback(null, content.toString() !== newOutput);
    });
  }

  generateContractConfig(contractConfig, callback = () => {}) {
    this.dappConfigs.blockchain = {
      dappConnection: contractConfig.dappConnection,
      dappAutoEnable: contractConfig.dappAutoEnable,
      warnIfMetamask: this.blockchainConfig.isDev,
      blockchainClient: this.blockchainConfig.ethereumClientName
    };
    this.generateArtifact(this.dappConfigs.blockchain, constants.dappArtifacts.blockchain, constants.dappArtifacts.dir, (err, path, _updated) => {
      callback(err, path);
    });
  }

  generateStorageConfig(storageConfig) {
    this.dappConfigs.storage = {
      dappConnection: storageConfig.dappConnection
    };
    this.generateArtifact(this.dappConfigs.storage, constants.dappArtifacts.storage, constants.dappArtifacts.dir);
  }

  generateCommunicationConfig(communicationConfig) {
    this.dappConfigs.communication = {
      connection: communicationConfig.connection
    };
    this.generateArtifact(this.dappConfigs.communication, constants.dappArtifacts.communication, constants.dappArtifacts.dir);
  }

  generateArtifact(artifactInput, fileName, dirName, cb = () => {}) {
    const dir = joinPath(this.embarkConfig.generationDir, dirName);
    const filePath = joinPath(dir, fileName);
    if (typeof artifactInput !== 'string') {
      artifactInput = JSON.stringify(artifactInput, null, 2);
    }
    async.waterfall([
      (next) => {
        fs.mkdirp(dir, next);
      },
      (_dir, next) => {
        this.checkIfNeedsUpdate(filePath, artifactInput, next);
      },
      (needsUpdate, next) => {
        if (!needsUpdate) {
          return next(null, false);
        }
        fs.writeFile(filePath, artifactInput, (err) => {
          next(err, true);
        });
      }
    ], (err, updated) => {
      if (err) {
        this.logger.error(err.message || err);
      }
      cb(err, filePath, updated);
    });
  }

  generateContractCode(contract, gasLimit) {
    let abi = JSON.stringify(contract.abiDefinition);

    let block = "";
    block += Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit});
    return block;
  }


  generateCustomContractCode(contract) {
    const customContractGeneratorPlugin = this.plugins.getPluginsFor('customContractGeneration').splice(-1)[0];
    if (!customContractGeneratorPlugin) {
      return null;
    }
    return customContractGeneratorPlugin.generateCustomContractCode(contract);
  }

  generateNamesInitialization(useEmbarkJS) {
    if (!useEmbarkJS || this.namesystemConfig === {}) return "";

    let result = "\n";
    result += Templates.define_when_env_loaded();
    result += this._getInitCode('names', this.namesystemConfig);

    return result;
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

  generateABI(contractsList, options) {
    let result = "";

    result += this.generateContracts(contractsList, options.useEmbarkJS, options.deployment, true);
    result += this.generateStorageInitialization(options.useEmbarkJS);
    result += this.generateCommunicationInitialization(options.useEmbarkJS);
    result += this.generateNamesInitialization(options.useEmbarkJS);

    return result;
  }

  generateContractJSON(className, contract) {
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

    return contractJSON;
  }

  generateContractsJSON(contractsList) {
    let contracts = {};

    for (let contract of contractsList) {
      contracts[contract.className] = this.generateContractJSON(contract.className, contract);
    }

    return contracts;
  }

  buildEmbarkJS(cb) {
    const self = this;
    let embarkjsCode = '';
    let code = "/* eslint-disable */";
    const deps = ['ipfs', 'swarm', 'whisper'];

    async.waterfall([
      // TODO: here due to a race condition when running embark build
      function generateConfig(next) {
        self.events.request("config:contractsConfig", (contractsConfig) => {
          self.generateContractConfig(contractsConfig, () => {
            next();
          });
        });
      },
      function getEmbarkJsLocation(next) {
        self.events.request('version:downloadIfNeeded', 'embarkjs', (err, location) => {
          if (err) {
            self.logger.error(__('Error downloading EmbarkJS'));
            return next(err);
          }
          next(null, location);
        });
      },
      function generateSymlink(location, next) {
        self.generateSymlink(location, 'embarkjs', (err, symlinkDest) => {
          if (err) {
            self.logger.error(__('Error creating a symlink to EmbarkJS'));
            return next(err);
          }
          embarkjsCode += `\nconst EmbarkJS = require("${symlinkDest}").default || require("${symlinkDest}");`;
          embarkjsCode += `\nEmbarkJS.environment = '${self.env}';`;
          embarkjsCode += "\nglobal.EmbarkJS = EmbarkJS;";
          next();
        });
      },
      ...deps.map((dep) => {
        return function(next) {
          self.events.request('version:downloadIfNeeded', `embarkjs-${dep}`, (err, location) => {
            if (err) {
              self.logger.error(__(`Error downloading embarkjs-${dep}`));
              return next(err);
            }

            self.generateSymlink(location, `embarkjs-${dep}`, (err, _symlinkDest) => {
              if (err) {
                self.logger.error(__(`Error creating a symlink to embarkjs-${dep}`));
                return next(err);
              }
              return next();
            });
          });
        };
      }),
      function getJSCode(next) {
        code += "\n" + embarkjsCode + "\n";

        code += self.getEmbarkJsProviderCode();
        code += self.generateCommunicationInitialization(true);
        code += self.generateStorageInitialization(true);
        code += self.generateNamesInitialization(true);
        code += self.getReloadPageCode();
        code += "\nexport default EmbarkJS;";
        code += "\nif (typeof module !== 'undefined' && module.exports) {" +
          "\n\tmodule.exports = EmbarkJS;" +
          "\n}";
        code += '\n/* eslint-enable */\n';

        next();
      },
      function writeFile(next) {
        self.generateArtifact(code, constants.dappArtifacts.embarkjs, '', next);
      },
      function transformCode(artifactPath, updated, next) {
        if (!updated) {
          return next();
        }
        transform(code, {
          cwd: embarkPath(),
          "presets": [
            [
              "@babel/preset-env", {
                "targets": {
                  "node": "8.11.3"
                }
              }
            ]
          ]
        }, (err, result) => {
          if (err) {
            return next(err);
          }
          self.generateArtifact(result.code, constants.dappArtifacts.embarkjsnode, '', next);
        });
      }
    ], function(_err, _result) {
      cb();
    });
  }

  getReloadPageCode() {
    return this.env === 'development' ? fs.readFileSync(path.join(__dirname, '/code/reload-on-change.js'), 'utf8') : '';
  }

  getEmbarkJsProviderCode() {
    return this.plugins.getPluginsFor('embarkjsCode').reduce((code, plugin) => (
      code += plugin.embarkjs_code.join('\n')
    ), '');
  }

  getInitProviderCode() {
    const codeTypes = {
      blockchain: this.blockchainConfig || {},
      communication: this.communicationConfig || {},
      names: this.namesystemConfig || {},
      storage: this.storageConfig || {}
    };

    return this.plugins.getPluginsFor("initConsoleCode").reduce((acc, plugin) => {
      Object.keys(codeTypes).forEach((codeTypeName) => {
        (plugin.embarkjs_init_console_code[codeTypeName] || []).forEach((initCode) => {
          const [block, shouldInit] = initCode;
          if (shouldInit.call(plugin, codeTypes[codeTypeName])) {
            acc += block;
          }
        });
      });
      return acc;
    }, "");
  }

  buildContractJS(contractName, contractJSON, cb) {
    const contractCode = `
      "use strict";

      const isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);
      const lib = isNode ? '../embarkjs.node' : '../embarkjs';

      const EmbarkJSNode = isNode && require('../embarkjs.node');
      let EmbarkJSBrowser;
      try {
        EmbarkJSBrowser = require('../embarkjs').default;
      } catch(e) {};

      const EmbarkJS = isNode ? EmbarkJSNode : EmbarkJSBrowser;

      let ${contractName}JSONConfig = ${JSON.stringify(contractJSON)};
      let ${contractName} = new EmbarkJS.Blockchain.Contract(${contractName}JSONConfig);
      module.exports = ${contractName};
    `.trim().replace(/^[\t\s]+/gm, '');

    this.generateArtifact(contractCode, contractName + '.js', constants.dappArtifacts.contractsJs, (err, path, _updated) => {
      cb(err, path);
    });
  }

  generateSymlink(target, name, callback) {
    async.waterfall([
      // Make directory
      next => {
        const symlinkDir = dappPath(this.embarkConfig.generationDir, constants.dappArtifacts.symlinkDir);
        fs.mkdirp(symlinkDir, (err) => {
          if (err) {
            return next(err);
          }
          next(null, joinPath(symlinkDir, name).replace(/\\/g, '/'));
        });
      },
      // Remove old symlink because they are not overwritable
      (symlinkDest, next) => {
        fs.remove(symlinkDest, (err) => {
          if (err) {
            return next(err);
          }
          next(null, symlinkDest);
        });
      },
      // Make target a directory as files don't work on Windows
      (symlinkDest, next) => {
        fs.stat(target, (err, stats) => {
          if (err) {
            return next(err);
          }
          let finalTarget = target;
          if (stats.isFile()) {
            finalTarget = path.dirname(target);
          }
          next(null, symlinkDest, finalTarget);
        });
      },
      (symlinkDest, finalTarget, next) => {
        fs.symlink(finalTarget, symlinkDest, 'junction', (err) => {
          if (err) {
            return next(err);
          }
          next(null, symlinkDest);
        });
      }
    ], callback);
  }
}

module.exports = CodeGenerator;
