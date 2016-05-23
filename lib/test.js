try {
  var ethersim = require('ethersim');
} catch(e) {
  var ethersim = false;
}
var web3 = require('web3');

Test = function(contractFiles, blockchainFile, contractFile, _env) {
  if (ethersim === false) {
    console.log('EtherSim not found; Please install it with "npm install ethersim --save"');
    console.log('For more information see https://github.com/iurimatias/ethersim');
    exit();
  }

  this.env = _env || 'development';
  this.web3 = web3;
  this.web3.setProvider(ethersim.web3Provider());
  this.contractFiles = contractFiles;

  Embark.init(this.web3);
  Embark.blockchainConfig.loadConfigFile(blockchainFile);
  Embark.contractsConfig.loadConfigFile(contractFile);

  Embark.contractsConfig.init(this.contractFiles, this.env);
}

Test.prototype.deployAll = function(cb) {
  Embark.deployContracts('development', this.contractFiles, "/tmp/abi.js", "chains.json", false, false, function(abi) {
    eval(abi);
    cb();
  });
}

module.exports = Test;
