require('ejs');

const Templates = {
  vanilla_contract: require('./vanilla-contract.js.ejs')
};

// TODO: this should be moved to the embark-web3 module from master
class Web3Plugin {

  constructor(embark, options) {
    this.embarkConfig = embark.config.embarkConfig;
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    let plugin = this.plugins.createPlugin('web3plugin', {});

    plugin.registerActionForEvent("deploy:contract:deployed", this.registerInVm.bind(this));
    plugin.registerActionForEvent("deploy:contract:deployed", this.addContractJSONToPipeline.bind(this));
    plugin.registerActionForEvent("deploy:contract:deployed", this.addContractFileToPipeline.bind(this));
    plugin.registerActionForEvent("pipeline:generateAll:before", this.addContractIndexToPipeline.bind(this));
  }

  registerInVm(params, cb) {
    let contract = params.contract;
    let abi = JSON.stringify(contract.abiDefinition);
    let gasLimit = 6000000;
    let contractCode = Templates.vanilla_contract({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit });

    this.events.request('runcode:eval', contractCode, (err) => {
      if (err) {
        return cb(err);
      }
      this.events.request('runcode:eval', contract.className, (err, result) => {
        if (err) {
          return cb(err);
        }
        this.events.emit("runcode:register", contract.className, result, () => { cb() });
      });
    });
  }

  addContractJSONToPipeline(params, cb) {
    // TODO: check if this is correct json object to generate
    const contract = params.contract;

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.buildDir, 'contracts'],
      file: contract.className + '.json',
      format: 'json',
      content: contract
    }, cb);
  }

  addContractFileToPipeline(params, cb) {
    const contract = params.contract;
    const contractName = contract.className;
    const contractJSON = contract.abiDefinition;

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

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'contracts'],
      file: contract.className + '.js',
      format: 'js',
      content: contractCode
    }, cb);
  }

  addContractIndexToPipeline(_params, cb) {
    this.events.request("contracts:list", (err, contracts) => {
      let imports = contracts.map((c) => {
        return `"${c.className}": require('./${c.className}').default)`;
      }).join(",\n");

      let code = 'module.exports = {\n';
      code += imports;
      code += '\n};';

      this.events.request("pipeline:register", {
        path: [this.embarkConfig.generationDir, 'contracts'],
        file: 'index.js',
        format: 'js',
        content: code
      }, cb);
    });
  }

}

module.exports = Web3Plugin;
