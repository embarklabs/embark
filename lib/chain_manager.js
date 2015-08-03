var fs = require('fs');
var web3 = require('web3');

ChainManager = function() { }

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
    this.chainManagerConfig[chainId] = {contracts: []};
  }
}

module.exports = ChainManager;

