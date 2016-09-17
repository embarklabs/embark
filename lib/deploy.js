var async = require('async');
var Compiler = require('./compiler.js');

var Deploy = function(web3, contractsManager, logger) {
  this.web3 = web3;
  this.contractsManager = contractsManager;
  this.logger = logger;
};

Deploy.prototype.deployContract = function(contract, params, callback) {
  var self = this;
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
      self.logger.info("error");
      callback(new Error(err));
    } else if (transaction.address !== undefined) {
      self.logger.info("address contract: " + transaction.address);
      contract.deployedAddress = transaction.address;
      callback(null, transaction.address);
    }
  });

  contractObject["new"].apply(contractObject, contractParams);
};

Deploy.prototype.deployAll = function(done) {
  var self = this;
  this.logger.info("deployAll");

  async.eachOfSeries(this.contractsManager.listContracts(),
                     function(contract, key, callback) {
                       self.logger.info(arguments);
                       self.deployContract(contract, null, callback);
                     },
                     function(err, results) {
                       self.logger.info("finished");
                       self.logger.info(arguments);
                       done();
                     }
                    );

};

module.exports = Deploy;

