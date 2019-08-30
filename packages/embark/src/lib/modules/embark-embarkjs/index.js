import {__} from 'embark-i18n';

require('ejs');
const Templates = {
  embarkjs_artifact: require('./embarkjs-artifact.js.ejs')
};

class EmbarkJS {

  constructor(embark, _options) {
    this.embark = embark;
    this.embarkConfig = embark.config.embarkConfig;
    this.events = embark.events;
    this.logger = embark.logger;

    this.events.request("runcode:whitelist", 'embarkjs', () => {
      this.registerEmbarkJS();
     });

    this.embarkJSPlugins = {};
    this.events.setCommandHandler("embarkjs:plugin:register", (stackName, pluginName, packageName) => {
      this.embarkJSPlugins[stackName] = this.embarkJSPlugins[stackName] || {};
      this.embarkJSPlugins[stackName][pluginName] = packageName;
    });

    this.events.setCommandHandler("embarkjs:console:register", (stackName, pluginName, packageName) => {
      this.events.request("runcode:whitelist", packageName, () => { });
      this.registerEmbarkJSPlugin(stackName, pluginName, packageName);
    });

    this.events.setCommandHandler("embarkjs:console:setProvider", this.setProvider.bind(this));

    embark.registerActionForEvent("pipeline:generateAll:before", this.addEmbarkJSArtifact.bind(this));
  }

  async registerEmbarkJS() {
    let checkEmbarkJS = `return (typeof EmbarkJS === 'undefined');`;
    let EmbarkJSNotDefined = await this.events.request2('runcode:eval', checkEmbarkJS);

    if (!EmbarkJSNotDefined) return;
    await this.events.request2("runcode:register", 'EmbarkJS', require('embarkjs'));
  }

  async registerEmbarkJSPlugin(stackName, pluginName, packageName) {
    await this.registerEmbarkJS();

    let moduleName = stackName;
    if (moduleName === 'messages') moduleName = 'Messages';
    if (moduleName === 'storage') moduleName = 'Storage';
    if (moduleName === 'blockchain') moduleName = 'Blockchain';

    const registerProviderCode = `
      const __embark_${stackName}_${pluginName} = require('${packageName}');
      EmbarkJS.${moduleName}.registerProvider('${pluginName}', __embark_${stackName}_${pluginName}.default || __embark_${stackName}_${pluginName});
    `;

    await this.events.request2('runcode:eval', registerProviderCode);
  }

  addEmbarkJSArtifact(_params, cb) {
    let embarkjsCode = Templates.embarkjs_artifact({ plugins: this.embarkJSPlugins });

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

    let code = "";
    if (stackName === 'storage') {
      code = `EmbarkJS.${moduleName}.setProviders(${JSON.stringify(config)});`;
    } else if (stackName === 'blockchain') {
      code = `EmbarkJS.${moduleName}.setProvider('${pluginName}', ${config});`;
    } else {
      code = `EmbarkJS.${moduleName}.setProvider('${pluginName}', ${JSON.stringify(config)});`;
    }
    await this.events.request2('runcode:eval', code);
  }

}

module.exports = EmbarkJS;
