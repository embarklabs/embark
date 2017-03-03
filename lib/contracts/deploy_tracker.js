var fs = require('../core/fs.js');

var DeployTracker = function(options) {
  this.logger = options.logger;
  this.env = options.env;
  this.chainConfig = options.chainConfig;
  this.web3 = options.web3;

  if (this.chainConfig === false) {
    this.currentChain = {contracts: []};
    return;
  }

  // TODO: need to make this async
  var block = this.web3.eth.getBlock(0);
  var chainId = block.hash;

  if (this.chainConfig[chainId] === undefined) {
    this.chainConfig[chainId] = {contracts: {}};
  }

  this.currentChain = this.chainConfig[chainId];

  this.currentChain.name = this.env;
  // TODO: add other params
  //this.currentChain.networkId = "";
  //this.currentChain.networkType = "custom"
};

DeployTracker.prototype.loadConfig = function(config) {
  this.chainConfig = config;
  return this;
};

DeployTracker.prototype.trackContract = function(contractName, code, args, address) {
  this.currentChain.contracts[this.web3.sha3(code + contractName + args.join(','))] = {
    name: contractName,
    address: address
  };
};

DeployTracker.prototype.getContract = function(contractName, code, args) {
  var contract = this.currentChain.contracts[this.web3.sha3(code + contractName + args.join(','))];
  if (contract && contract.address === undefined) { return false; }
  return contract;
};

// TODO: abstract this
// chainConfig can be an abstract PersistentObject
DeployTracker.prototype.save = function() {
  if (this.chainConfig === false) { return; }
  fs.writeJSONSync("./chains.json", this.chainConfig);
};

module.exports = DeployTracker;

