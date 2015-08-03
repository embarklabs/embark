var fs = require('fs');
var web3 = require('web3');
var sha3_256 = require('js-sha3').sha3_256;

ChainManager = function() {
  this.currentChain = {};
}

ChainManager.prototype.loadConfigFile = function(filename) {
  try {
    var obj = JSON.parse(fs.readFileSync(filename));
    this.chainManagerConfig = obj;
  } catch (e) {
    throw new Error("error reading " + filename);
  }
  return this;
};

ChainManager.prototype.loadConfig = function(config) {
  this.chainManagerConfig = config;
  return this;
};

ChainManager.prototype.init = function(env, blockchainConfig) {
  var config = blockchainConfig.config(env);

  web3.setProvider(new web3.providers.HttpProvider("http://" + config.rpcHost + ":" + config.rpcPort));

  var chainId = web3.eth.getBlock(0).hash;

  if (this.chainManagerConfig[chainId] === undefined) {
    this.chainManagerConfig[chainId] = {contracts: {}};
  }

  this.currentChain = this.chainManagerConfig[chainId];
}

ChainManager.prototype.addContract = function(contractName, code, address) {
  this.currentChain.contracts[sha3_256(code)] = {
    name: contractName,
    address: address
  }
}

module.exports = ChainManager;

