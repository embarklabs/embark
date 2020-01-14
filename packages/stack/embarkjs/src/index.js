import {__} from 'embark-i18n';

require('ejs');
const Templates = {
  embarkjs_artifact: require('./embarkjs-artifact.js.ejs'),
  embarkjs_contract_artifact: require('./embarkjs-contract-artifact.js.ejs'),
  embarkjs_console_contract: require('./embarkjs-console-contract.js.ejs')
};

class EmbarkJS {

  constructor(embark, _options) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.blockchainConfig = embark.config.blockchainConfig;
    this.events = embark.events;
    this.logger = embark.logger;
    this.contractArtifacts = {};

    this.events.request("runcode:whitelist", 'embarkjs', () => {
      this.registerEmbarkJS();
    });

    this.embarkJSPlugins = {};
    this.customEmbarkJSPlugins = {};
    this.events.setCommandHandler("embarkjs:plugin:register", (stackName, pluginName, packageName) => {
      this.embarkJSPlugins[stackName] = this.embarkJSPlugins[stackName] || {};
      this.embarkJSPlugins[stackName][pluginName] = packageName;
    });
    this.events.setCommandHandler("embarkjs:plugin:register:custom", (stackName, pluginName, packageName) => {
      this.customEmbarkJSPlugins[stackName] = this.customEmbarkJSPlugins[stackName] || {};
      this.customEmbarkJSPlugins[stackName][pluginName] = packageName;
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

    embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSArtifact.bind(this));
    embark.registerActionForEvent("pipeline:generateAll:before", this.addContractIndexArtifact.bind(this));
  }

  async registerEmbarkJS() {
    const checkEmbarkJS = `return (typeof EmbarkJS === 'undefined');`;
    const embarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (!embarkJSNotDefined) return;
    await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
  }

  async registerEmbarkJSPlugin(stackName, pluginName, packageName, cb) {
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
    await this.registerEmbarkJS();

    const customPluginCode = `
      let __embark${pluginName} = require('${packageName}');
      __embark${pluginName} = __embark${pluginName}.default || __embark${pluginName};
      const customPluginOptions = ${JSON.stringify(options)};
      EmbarkJS.${stackName} = new __embark${pluginName}({pluginConfig: customPluginOptions});
      EmbarkJS.${stackName}.init();
    `;

    await this.events.request2('runcode:eval', customPluginCode);
    cb();
  }

  addEmbarkJSArtifact(_params, cb) {
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
