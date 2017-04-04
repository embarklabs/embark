let fs = require('../core/fs.js');

class DeployTracker {
  constructor(options) {
    this.logger = options.logger;
    this.env = options.env;
    this.chainConfig = options.chainConfig;
    this.web3 = options.web3;

    if (this.chainConfig === false) {
      this.currentChain = {contracts: []};
      return;
    }

    // TODO: need to make this async
    let block = this.web3.eth.getBlock(0);
    let chainId = block.hash;

    if (this.chainConfig[chainId] === undefined) {
      this.chainConfig[chainId] = {contracts: {}};
    }

    this.currentChain = this.chainConfig[chainId];

    this.currentChain.name = this.env;
    // TODO: add other params
    //this.currentChain.networkId = "";
    //this.currentChain.networkType = "custom"
  }

  loadConfig(config) {
    this.chainConfig = config;
    return this;
  }

  trackContract(contractName, code, args, address) {
    this.currentChain.contracts[this.web3.sha3(code + contractName + args.join(','))] = {
      name: contractName,
      address: address
    };
  }

  getContract(contractName, code, args) {
    let contract = this.currentChain.contracts[this.web3.sha3(code + contractName + args.join(','))];
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

