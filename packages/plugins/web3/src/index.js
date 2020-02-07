const {__} = require('embark-i18n');
const Web3 = require('web3');

require('ejs');
const Templates = {
  contract_artifact: require('./contract-artifact.js.ejs'),
  web3_init: require('./web3_init.js.ejs'),
  console_contract: require('./console-contract.js.ejs')
};

const GAS_LIMIT = 6000000;

class EmbarkWeb3 {
  constructor(embark) {
    this.embarkConfig = embark.config.embarkConfig;
    this.contractsConfig = embark.config.contractsConfig;
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.config = embark.config;
    this.contractArtifacts = {};

    if (!this.config.blockchainConfig.enabled || this.config.contractsConfig.library !== 'web3') {
      return;
    }

    this.events.on("blockchain:started", async () => {
      await this.registerWeb3Object();
    });

    embark.registerActionForEvent("pipeline:generateAll:before", this.addWeb3JSArtifact.bind(this));

    embark.registerActionForEvent("deployment:contract:deployed", {priority: 40}, this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:deployed", this.registerArtifact.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerArtifact.bind(this));
  }

  async registerWeb3Object() {
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
    const contract = params.contract;
    const abi = contract.abiDefinition;
    const gasLimit = GAS_LIMIT;
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const contractCode = Templates.console_contract({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit, provider: provider });

    try {
      await this.events.request2('runcode:eval', contractCode);
      const result = await this.events.request2('runcode:eval', contract.className);
      result.currentProvider = provider;
      await this.events.request2("runcode:register", contract.className, result);
    } catch (err) {
      return cb(err);
    }
    cb();
  }

  registerArtifact(params, cb) {
    const contract = params.contract;
    const abi = JSON.stringify(contract.abiDefinition);
    const gasLimit = GAS_LIMIT;
    this.contractArtifacts[contract.className] = contract.className + '.js';

    const contractCode = Templates.contract_artifact({ className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit });

    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir, 'contracts'],
      file: contract.className + '.js',
      format: 'js',
      content: contractCode
    }, cb);
  }

  async addWeb3JSArtifact(_params, cb) {
    const dappConnection = this.contractsConfig.dappConnection;

    if (dappConnection.includes('$EMBARK')) {
      let endpoint = await this.events.request2('proxy:endpoint:get');
      dappConnection[dappConnection.indexOf('$EMBARK')] = endpoint;
    }

    const web3jsCode = Templates.web3_init({
      connectionList: this.contractsConfig.dappConnection,
      autoEnable: this.contractsConfig.dappAutoEnable
    });

    // TODO: generate a .node file
    this.events.request("pipeline:register", {
      path: [this.embarkConfig.generationDir],
      file: 'web3.js',
      format: 'js',
      content: web3jsCode
    }, cb);
  }

}

module.exports = EmbarkWeb3;
