let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');

class DeployTracker {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.embark = embark;
    this.trackContracts = (options.trackContracts !== false);

    // TODO: unclear where it comes from
    this.env = options.env;
    //this.chainConfig = options.chainConfig;
    this.chainConfig = embark.config.chainTracker;
    this.registerEvents();
  }

  registerEvents() {
    const self = this;

    this.events.setCommandHandler("deployTracker:load", this.setCurrentChain.bind(this));

    this.events.on("deploy:contract:deployed", (contract) => {
      self.trackContract(contract.className, contract.realRuntimeBytecode, contract.realArgs, contract.deployedAddress);
      self.save();
    });

    self.embark.registerActionForEvent("deploy:contract:shouldDeploy", (params, cb) => {
      if (!self.trackContracts) {
        return cb(params);
      }

      let contract = params.contract;
      let trackedContract = self.getContract(contract.className, contract.realRuntimeBytecode, contract.realArgs);
      if (trackedContract) {
        params.contract.address = trackedContract.address;
      }
      if (params.shouldDeploy && trackedContract) {
         params.shouldDeploy = true;
      }
      cb(params);
    });
  }

  setCurrentChain(cb) {
    const self = this;
    if (this.chainConfig === false) {
      this.currentChain = {contracts: []};
      return cb();
    }
    this.events.request("blockchain:block:byNumber", 0, function(_err, block) {
      let chainId = block.hash;

      if (self.chainConfig[chainId] === undefined) {
        self.chainConfig[chainId] = {contracts: {}};
      }

      self.currentChain = self.chainConfig[chainId];

      self.currentChain.name = self.env;
      cb();
    });
  }

  loadConfig(config) {
    this.chainConfig = config;
    return this;
  }

  trackContract(contractName, code, args, address) {
    if (!this.currentChain) return false;
    this.currentChain.contracts[utils.sha3(code + contractName + args.join(','))] = {
      name: contractName,
      address: address
    };
  }

  getContract(contractName, code, args) {
    if (!this.currentChain) return false;
    let contract = this.currentChain.contracts[utils.sha3(code + contractName + args.join(','))];
    if (contract && contract.address === undefined) {
      return false;
    }
    return contract;
  }

  // TODO: abstract this
  // chainConfig can be an abstract PersistentObject
  save() {
    if (this.chainConfig === false) {
      return;
    }
    fs.writeJSONSync("./chains.json", this.chainConfig, {spaces: 2});
  }

}

module.exports = DeployTracker;
