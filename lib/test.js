var ethersim = require('ethersim');
var web3 = require('web3');

Test = function(cb) {
  var Manager  = ethersim.Manager;
  var Provider = ethersim.Provider;

  var manager = new Manager();
  web3.setProvider(new Provider(manager));

  Embark.init(web3);
  Embark.blockchainConfig.loadConfigFile('config/blockchain.yml');
  Embark.contractsConfig.loadConfigFile('config/contracts.yml');

  var files = ["app/contracts/simple_storage.sol"];

  Embark.contractsConfig.init(files, 'development');

  Embark.deployContracts('development', files, "/tmp/abi.js", "chains.json", false, false, function(abi) {
    console.log("return abi");
    console.log(abi);
    eval(abi);
    cb();
  });
}

//Test.prototype.deploy_contract = function(className, params)

module.exports = Test;
