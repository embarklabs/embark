const {__} = require('embark-i18n');
const Web3 = require('web3');
const async = require('async');

require('ejs');
const Templates = {
  vanilla_contract: require('./vanilla-contract.js.ejs'),
  contract_artifact: require('./contract-artifact.js.ejs'),
  embarkjs_contract_artifact: require('./embarkjs-contract-artifact.js.ejs'),
  web3_init: require('./web3_init.js.ejs'),
};

class EmbarkWeb3 {
  constructor(embark, _options) {
    this.embarkConfig = embark.config.embarkConfig;
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.config = embark.config;

    this.setupWeb3Api();
    this.setupEmbarkJS();

    embark.registerActionForEvent("pipeline:generateAll:before", this.addWeb3Artifact.bind(this));
    embark.registerActionForEvent("deployment:contract:deployed", this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerInVm.bind(this));
    // embark.registerActionForEvent("deployment:contract:deployed", this.registerArtifact.bind(this));
    // embark.registerActionForEvent("deployment:contract:undeployed", this.registerArtifact.bind(this));
  }

  async setupEmbarkJS() {
    this.events.request("embarkjs:plugin:register", 'blockchain', 'web3', 'embarkjs-web3');
    this.events.request("embarkjs:console:register", 'blockchain', 'web3', 'embarkjs-web3');
    this.events.on("blockchain:started", async () => {
      await this.registerWeb3Object()
      this.events.request("embarkjs:console:setProvider", 'blockchain', 'web3', '{web3}');
    });
  }

  async setupWeb3Api() {
    this.events.request("runcode:whitelist", 'web3', () => { });
    this.events.on("blockchain:started", this.registerWeb3Object.bind(this));
  }

  async registerWeb3Object() {
    let checkWeb3 = `return (typeof web3 === 'undefined');`;
    let Web3NotDefined = await this.events.request2('runcode:eval', checkWeb3);

    if (!Web3NotDefined) return;

    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    await this.events.request2("runcode:register", 'web3', web3);
    const accounts = await web3.eth.getAccounts();
    await this.events.request2('runcode:eval', `web3.eth.defaultAccount = '${accounts[0]}'`);

    await this.events.request2('console:register:helpCmd', {
      cmdName: "web3",
      cmdHelp: __("instantiated web3.js object configured to the current environment")
    });
  }

  async registerInVm(params, cb) {
    let contract = params.contract;
    let abi = JSON.stringify(contract.abiDefinition);
    let gasLimit = 6000000;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    let contractCode = Templates.vanilla_contract({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit, provider: provider });

    try {
      await this.events.request2('runcode:eval', contractCode);
      let result = await this.events.request2('runcode:eval', contract.className);
      result.currentProvider = provider;
      await this.events.request2("runcode:register", contract.className, result);
      cb();
    } catch (err) {
      cb(err);
    }
  }

  addWeb3Artifact(_params, cb) {
    async.map(this.config.contractsConfig.dappConnection, (conn, mapCb) => {
      if (conn === '$EMBARK') {
        // Connect to Embark's endpoint (proxy)
        return this.events.request("proxy:endpoint", mapCb);
      }
      mapCb(null, conn);
    }, (err, results) => {
      if (err) {
        this.logger.error(__('Error getting dapp connection'));
        return cb(err);
      }
      let web3Code = Templates.web3_init({connectionList: results});

    // TODO: generate a .node file
      this.events.request("pipeline:register", {
        path: [this.embarkConfig.generationDir, 'contracts'],
        file: 'web3_init.js',
        format: 'js',
        content: web3Code
      }, cb);
    });
  }

  registerArtifact(params, cb) {
    let contract = params.contract;
    let abi = JSON.stringify(contract.abiDefinition);
    let gasLimit = 6000000;

    let contractCode = Templates.embarkjs_contract_artifact({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit });

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'contracts'],
      file: contract.className + '.js',
      format: 'js',
      content: contractCode
    }, cb);
  }

}

module.exports = EmbarkWeb3;
