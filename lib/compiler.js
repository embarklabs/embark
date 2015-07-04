var web3 = require('web3');

Compiler = function(blockchainConfig) {
  this.blockchainConfig = blockchainConfig;
};

Compiler.prototype.init = function(env) {
  var config = this.blockchainConfig.config(env);

  try {
    web3.setProvider(new web3.providers.HttpProvider("http://" + config.rpcHost + ":" + config.rpcPort));
    primaryAddress = web3.eth.coinbase;
    web3.eth.defaultAccount = primaryAddress;
  } catch (e) {
    throw new Error("can't connect to " + config.rpcHost + ":" + config.rpcPort + " check if an ethereum node is running");
  }

  console.log("address is : " + primaryAddress);
};

Compiler.prototype.compile = function(source) {
  return web3.eth.compile.solidity(source);
};

module.exports = Compiler;
