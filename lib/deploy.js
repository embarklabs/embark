var async = require('async');
var Compiler = require('./compiler.js');

var Deploy = function(web3, contractsManager) {
  this.web3 = web3;
  this.contractsManager = contractsManager;
};

Deploy.prototype.deployContract = function(contract, params, callback) {
  var contractObject = this.web3.eth.contract(contract.abiDefinition);

  var contractParams = params || contract.args;

  contractParams.push({
    from: this.web3.eth.coinbase,
    data: contract.code,
    gas: contract.gasLimit,
    gasPrice: contract.gasPrice
  });

  contractParams.push(function(err, transaction) {
    if (err) {
      console.log("error");
      callback(new Error(err));
    } else if (transaction.address !== undefined) {
      console.log("address contract: " + transaction.address);
      contract.deployedAddress = transaction.address;
      callback(null, transaction.address);
    }
  });

  contractObject["new"].apply(contractObject, contractParams);
};

Deploy.prototype.deployAll = function(done) {
  var self = this;
  console.log("deployAll");

  async.eachOfSeries(this.contractsManager.listContracts(),
                     function(contract, key, callback) {
                       console.log(arguments);
                       self.deployContract(contract, null, callback);
                     },
                     function(err, results) {
                       console.log("finished");
                       console.log(arguments);
                       done();
                     }
                    );

};

module.exports = Deploy;

