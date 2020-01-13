import {__} from 'embark-i18n';
import Web3 from 'web3';

require('ejs');
const Templates = {
  embarkjs_artifact: require('./embarkjs-artifact.js.ejs'),
  embarkjs_contract_artifact: require('./embarkjs-contract-artifact.js.ejs'),
  embarkjs_console_contract: require('./embarkjs-console-contract.js.ejs')
};

class EmbarkJS {

  constructor(embark) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.events = embark.events;
    this.logger = embark.logger;
    this.config = embark.config;
    this.contractArtifacts = {};
    this.enabled = true;

    // note: since other plugins like ens currently expect these command handlers to exist
    // we used a condition instead just returning immediatly so that the handlers still exist
    if (!this.config.blockchainConfig.enabled || this.config.contractsConfig.library !== 'embarkjs') {
      this.enabled = false;
    }

    this.embarkJSPlugins = {};
    this.customEmbarkJSPlugins = {};
    this.events.setCommandHandler("embarkjs:plugin:register", (stackName, pluginName, packageName, cb) => {
      this.embarkJSPlugins[stackName] = this.embarkJSPlugins[stackName] || {};
      this.embarkJSPlugins[stackName][pluginName] = packageName;
      if (typeof cb === "function") {
        cb();
      }
    });
    this.events.setCommandHandler("embarkjs:plugin:register:custom", (stackName, pluginName, code, cb) => {
      this.customEmbarkJSPlugins[stackName] = this.customEmbarkJSPlugins[stackName] || {};
      this.customEmbarkJSPlugins[stackName][pluginName] = code;
      cb();
    });

    this.events.setCommandHandler("embarkjs:console:register", (stackName, pluginName, packageName, cb) => {
      this.events.request("runcode:whitelist", packageName, () => {});
      this.registerEmbarkJSPlugin(stackName, pluginName, packageName, cb || (() => {}));
    });

    this.events.setCommandHandler("embarkjs:console:register:custom", (stackName, pluginName, packageName, options, cb) => {
      this.events.request("runcode:whitelist", packageName, () => {});
      this.registerCustomEmbarkJSPluginInVm(stackName, pluginName, packageName, options, cb || (() => {}));
    });

    this.events.setCommandHandler("embarkjs:console:setProvider", this.setProvider.bind(this));
    this.events.setCommandHandler("embarkjs:contract:generate", this.addContractArtifact.bind(this));
    this.events.setCommandHandler("embarkjs:contract:runInVm", this.runInVm.bind(this));

    if (!this.enabled) return;

    this.events.request("runcode:whitelist", 'embarkjs', () => {
      this.registerEmbarkJS();
    });

    embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSArtifact.bind(this));
    embark.registerActionForEvent("pipeline:generateAll:before", this.addContractIndexArtifact.bind(this));

    this.setupEmbarkJS();

    embark.registerActionForEvent("deployment:contract:deployed", {priority: 40}, this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:deployed", this.registerArtifact.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerArtifact.bind(this));
  }

  async setupEmbarkJS() {
    this.events.on("blockchain:started", async () => {
      await this.registerWeb3Object();
      this.events.request("embarkjs:console:setProvider", 'blockchain', 'web3', '{web3}');
    });
    this.events.request("embarkjs:plugin:register", 'blockchain', 'web3', 'embarkjs-web3');
    await this.events.request2("embarkjs:console:register", 'blockchain', 'web3', 'embarkjs-web3');
  }

  async registerWeb3Object() {
    if (!this.enabled) return;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    this.events.request("runcode:whitelist", 'web3', () => {});
    await this.events.request2("runcode:register", 'web3', web3);
    const accounts = await web3.eth.getAccounts();
    if (accounts.length) {
      await this.events.request2('runcode:eval', `web3.eth.defaultAccount = '${accounts[0]}'`);
    }

    this.events.request('console:register:helpCmd', {
      cmdName: "web3",
      cmdHelp: __("instantiated web3.js object configured to the current environment")
    }, () => {});
  }

  async registerInVm(params, cb) {
    if (!this.enabled) return;
    this.events.request("embarkjs:contract:runInVm", params.contract, cb);
  }

  registerArtifact(params, cb) {
    if (!this.enabled) return;
    this.events.request("embarkjs:contract:generate", params.contract, cb);
  }

  async registerEmbarkJS() {
    if (!this.enabled) return;
    const checkEmbarkJS = `return (typeof EmbarkJS === 'undefined');`;
    const embarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (!embarkJSNotDefined) return;
    await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
  }

  async registerEmbarkJSPlugin(stackName, pluginName, packageName, cb) {
    if (!this.enabled) return cb();
    await this.registerEmbarkJS();

    let moduleName = stackName;
    if (moduleName === 'messages') moduleName = 'Messages';
    if (moduleName === 'storage') moduleName = 'Storage';
    if (moduleName === 'blockchain') moduleName = 'Blockchain';
    if (moduleName === 'names') moduleName = 'Names';

    const registerProviderCode = `
      const __embark_${stackName}_${pluginName} = require('${packageName}');
      EmbarkJS.${moduleName}.registerProvider('${pluginName}', __embark_${stackName}_${pluginName}.default || __embark_${stackName}_${pluginName});
    `;

    await this.events.request2('runcode:eval', registerProviderCode);
    cb();
  }

  async registerCustomEmbarkJSPluginInVm(stackName, pluginName, packageName, options, cb) {
    if (!this.enabled) return cb();
    await this.registerEmbarkJS();

    const customPluginCode = `
      let __embark${pluginName} = require('${packageName}');
      __embark${pluginName} = __embark${pluginName}.default || __embark${pluginName};
      const customPluginOptions = ${JSON.stringify(options)};
      EmbarkJS.${stackName} = new __embark${pluginName}({pluginConfig: customPluginOptions});
      if (typeof EmbarkJS.${stackName}.init === "function") {
        EmbarkJS.${stackName}.init();
      }
    `;

    await this.events.request2('runcode:eval', customPluginCode);
    cb();
  }

  addEmbarkJSArtifact(_params, cb) {
    if (!this.enabled) return cb();
    const embarkjsCode = Templates.embarkjs_artifact({
      plugins: this.embarkJSPlugins,
      hasWebserver: this.embark.config.webServerConfig.enabled,
      customPlugins: this.customEmbarkJSPlugins
    });

    // TODO: generate a .node file
    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir],
      file: 'embarkjs.js',
      format: 'js',
      content: embarkjsCode
    }, cb);
  }

  async setProvider(stackName, pluginName, config) {
    if (!this.enabled) return;
    let moduleName = stackName;
    if (moduleName === 'messages') moduleName = 'Messages';
    if (moduleName === 'storage') moduleName = 'Storage';
    if (moduleName === 'blockchain') moduleName = 'Blockchain';
    if (moduleName === 'names') moduleName = 'Names';

    let code = "";
    if (stackName === 'storage') {
      code = `EmbarkJS.${moduleName}.setProviders(${JSON.stringify(config)});`;
    } else if (stackName === 'blockchain' || stackName === 'names') {
      const endpoint = await this.events.request2("proxy:endpoint:get");
      const dappConnectionConfig = {
        dappConnection: [endpoint]
      };
      if (stackName === 'blockchain') {
        code = `EmbarkJS.${moduleName}.setProvider('${pluginName}', ${config});
              EmbarkJS.Blockchain.connect(${JSON.stringify(dappConnectionConfig)}, (err) => {if (err) { console.error(err); } });`;
      } else {
        code = `EmbarkJS.${moduleName}.setProvider('${pluginName}', ${JSON.stringify(Object.assign(config, dappConnectionConfig))});`;
      }

    } else {
      code = `EmbarkJS.${moduleName}.setProvider('${pluginName}', ${JSON.stringify(config)});`;
    }
    await this.events.request2('runcode:eval', code);
  }

  async addContractArtifact(contract, cb) {
    if (!this.enabled) return cb();
    const abi = JSON.stringify(contract.abiDefinition);
    const gasLimit = 6000000;
    this.contractArtifacts[contract.className] = contract.className + '.js';

    const contractCode = Templates.embarkjs_contract_artifact({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit });

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'contracts'],
      file: contract.className + '.js',
      format: 'js',
      content: contractCode
    }, cb);
  }

  async addContractIndexArtifact(_options, cb) {
    if (!this.enabled) return cb();
    let indexCode = 'module.exports = {';
    Object.keys(this.contractArtifacts).forEach(className => {
      indexCode += `\n"${className}": require('./${this.contractArtifacts[className]}').default,`;
    });
    indexCode += `\n};`;

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'contracts'],
      file: 'index.js',
      format: 'js',
      content: indexCode
    }, cb);
  }

  async runInVm(contract, cb) {
    if (!this.enabled) return cb();
    const abi = contract.abiDefinition;
    const gasLimit = 6000000;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const contractCode = Templates.embarkjs_console_contract({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit, provider: provider });

    try {
      await this.registerEmbarkJS();
      await this.events.request2('runcode:eval', contractCode);
      const result = await this.events.request2('runcode:eval', contract.className);
      result.currentProvider = provider;
      await this.events.request2("runcode:register", contract.className, result);
    } catch (err) {
      return cb(err);
    }
    cb();
  }

}

module.exports = EmbarkJS;
