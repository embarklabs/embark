const {__} = require('embark-i18n');
const Web3 = require('web3');

require('ejs');
// const Templates = {
//   vanilla_contract: require('./vanilla-contract.js.ejs'),
//   contract_artifact: require('./contract-artifact.js.ejs'),
//   web3_init: require('./web3_init.js.ejs')
// };

class EmbarkWeb3 {
  constructor(embark, _options) {
    this.embarkConfig = embark.config.embarkConfig;
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.config = embark.config;

    this.setupWeb3Api();
    this.setupEmbarkJS();

    embark.registerActionForEvent("deployment:contract:deployed", this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerInVm.bind(this));
    embark.registerActionForEvent("deployment:contract:deployed", this.registerArtifact.bind(this));
    embark.registerActionForEvent("deployment:contract:undeployed", this.registerArtifact.bind(this));
  }

  async setupEmbarkJS() {
    this.events.request("embarkjs:plugin:register", 'blockchain', 'web3', 'embarkjs-web3');
    await this.events.request2("embarkjs:console:register", 'blockchain', 'web3', 'embarkjs-web3');
    this.events.on("blockchain:started", async () => {
      await this.registerWeb3Object();
      this.events.request("embarkjs:console:setProvider", 'blockchain', 'web3', '{web3}');
    });
  }

  async setupWeb3Api() {
    this.events.request("runcode:whitelist", 'web3', () => { });
    this.events.on("blockchain:started", this.registerWeb3Object.bind(this));
  }

  async registerWeb3Object() {
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    const web3 = new Web3(provider);
    await this.events.request2("runcode:register", 'web3', web3);
    const accounts = await web3.eth.getAccounts();
    if (accounts.length) {
      await this.events.request2('runcode:eval', `web3.eth.defaultAccount = '${accounts[0]}'`);
    }

    await this.events.request2('console:register:helpCmd', {
      cmdName: "web3",
      cmdHelp: __("instantiated web3.js object configured to the current environment")
    });
  }

  async registerInVm(params, cb) {
    this.events.request("embarkjs:contract:runInVm", params.contract, cb);
  }

  registerArtifact(params, cb) {
    this.events.request("embarkjs:contract:generate", params.contract, cb);
  }

}

module.exports = EmbarkWeb3;
