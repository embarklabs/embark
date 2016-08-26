var Web3 = require('web3');
var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
//var EmbarkJS = require('../js/embark.js');

var initAccounts = function(sim, web3, done) {
  sim.createAccounts(10, function() {
    sim.setBalance(web3.eth.accounts[0], 1000000000000000000000, function() {
      done();
    });
  });
};

var Test = function(options) {
  try {
    this.EtherSim = require('ethersim');
  } catch(e) {
    this.EtherSim = false;
  }

  if (this.EtherSim === false) {
    console.log('EtherSim not found; Please install it with "npm install ethersim --save"');
    console.log('For more information see https://github.com/iurimatias/ethersim');
    exit();
  }
};

Test.prototype.deployContract = function(className, args, cb) {
  var self = this;
  this.web3 = new Web3();
  this.sim = new this.EtherSim.init();
  this.web3.setProvider(this.sim.provider);

  var contractsManager = new ContractsManager('./config/', ['app/contracts/*.sol'], 'development');
  contractsManager.init();
  contractsManager.build();

  var deploy = new Deploy(this.web3, contractsManager);
  var contract = contractsManager.contracts[className];

  initAccounts(this.sim, this.web3, function() {
    deploy.deployContract(contract, args, function(err, address) {
      console.log("deployed");
      console.log(address);

      console.log(contract);

      var deployedContract = new EmbarkJS.Contract({
        abi: contract.abiDefinition,
        address: address,
        code: contract.code,
        web3: self.web3
      });

      cb(deployedContract);
    });
  });
};






module.exports = Test;
