var fs = require('fs');
var sha3_256 = require('js-sha3').sha3_256;

ChainManager = function() {
  this.chainManagerConfig = {};
  this.currentChain = {};
  this.file = "";
}

ChainManager.prototype.loadConfigFile = function(filename) {
  this.file = filename;
  try {
    var obj = JSON.parse(fs.readFileSync(filename));
    this.chainManagerConfig = obj;
  } catch (e) {
    console.warn("error reading " + filename + "; defaulting to empty set");
  }
  return this;
};

ChainManager.prototype.loadConfig = function(config) {
  this.chainManagerConfig = config;
  return this;
};

ChainManager.prototype.init = function(env, config, web3) {
  var block = web3.eth.getBlock(0);
  if(!block){
    throw new Error("Cannot get the genesis block, is embark blockchain running ?");
  }
  var chainId = block.hash;

  if (this.chainManagerConfig[chainId] === undefined) {
    this.chainManagerConfig[chainId] = {contracts: {}};
  }

  this.currentChain = this.chainManagerConfig[chainId];
}

ChainManager.prototype.addContract = function(contractName, code, args, address) {
  this.currentChain.contracts[sha3_256(code + contractName + args.join(','))] = {
    name: contractName,
    address: address
  }
}

ChainManager.prototype.getContract = function(contractName, code, args) {
  return this.currentChain.contracts[sha3_256(code + contractName + args.join(','))];
}

ChainManager.prototype.save = function() {
  fs.writeFileSync(this.file, JSON.stringify(this.chainManagerConfig));
}

module.exports = ChainManager;
