try {
  var EtherSim = require('ethersim');
} catch(e) {
  var EtherSim = false;
}
var Web3 = require('web3');
var web3

Test = function(contractFiles, blockchainFile, contractFile, _env) {
  if (EtherSim === false) {
    console.log('EtherSim not found; Please install it with "npm install ethersim --save"');
    console.log('For more information see https://github.com/iurimatias/ethersim');
    exit();
  }

  this.env = _env || 'development';
  this.web3 = new Web3();
  this.sim = new EtherSim.init();
  this.web3.setProvider(this.sim.provider);
  this.contractFiles = contractFiles;

  Embark.init(this.web3);
  Embark.blockchainConfig.loadConfigFile(blockchainFile);
  Embark.contractsConfig.loadConfigFile(contractFile);

  Embark.contractsConfig.init(this.contractFiles, this.env);
}

Test.prototype.deployAll = function(cb) {
  var web3 = this.web3;
  Embark.deployContracts('development', this.contractFiles, "/tmp/abi.js", "chains.json", false, false, function(abi) {
    eval(abi);
    cb();
  });
}

module.exports = Test;

