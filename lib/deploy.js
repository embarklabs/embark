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

  self.logger.info("deploying " + contract.className);
  contractParams.push(function(err, transaction) {
    self.logger.contractsState(self.contractsManager.contractsState());

    if (err) {
      self.logger.error("error deploying contract: " + contract.className);
      self.logger.error(err.toString());
      self.logger.contractsState(self.contractsManager.contractsState());
      callback(new Error(err));
    } else if (transaction.address !== undefined) {
      self.logger.info(contract.className + " deployed at " + transaction.address);
      contract.deployedAddress = transaction.address;
      self.logger.contractsState(self.contractsManager.contractsState());
      callback(null, transaction.address);
    }
  });

  contractObject["new"].apply(contractObject, contractParams);
};

Deploy.prototype.deployAll = function(done) {
  var self = this;
  this.logger.info("deploying contracts");

  async.eachOfSeries(this.contractsManager.listContracts(),
                     function(contract, key, callback) {
                       self.logger.trace(arguments);
                       self.deployContract(contract, null, callback);
                     },
                     function(err, results) {
                       self.logger.info("finished");
                       self.logger.trace(arguments);
                       done();
                     }
                    );

};

module.exports = Deploy;

