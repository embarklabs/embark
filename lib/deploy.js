var async = require('async');
var Compiler = require('./compiler.js');
var DeployTracker = require('./deploy_tracker.js');

var Deploy = function(options) {
  this.web3 = options.web3;
  this.contractsManager = options.contractsManager;
  this.logger = options.logger;
  this.env = options.env;

  this.deployTracker = new DeployTracker({
    logger: options.logger, chainConfig: options.chainConfig, web3: options.web3, env: this.env
  });
};

Deploy.prototype.checkAndDeployContract = function(contract, params, callback) {
  var self = this;

  if (contract.address !== undefined) {

    // determine arguments
    var suppliedArgs = (params || contract.args);
    var realArgs = [];

    for (var l = 0; l < suppliedArgs.length; l++) {
      var arg = suppliedArgs[l];
      if (arg[0] === "$") {
        var contractName = arg.substr(1);
        var referedContract = this.contractsManager.getContract(contractName);
        realArgs.push(referedContract.deployedAddress);
      } else {
        realArgs.push(arg);
      }
    }

    contract.deployedAddress = contract.address;
    self.deployTracker.trackContract(contract.className, contract.code, realArgs, contract.address);
    self.deployTracker.save();
    self.logger.contractsState(self.contractsManager.contractsState());
    return callback();
  }

  var trackedContract = self.deployTracker.getContract(contract.className, contract.code, contract.args);

  if (trackedContract && this.web3.eth.getCode(trackedContract.address) !== "0x") {
    self.logger.info(contract.className + " already deployed " + trackedContract.address);
    contract.deployedAddress = trackedContract.address;
    self.logger.contractsState(self.contractsManager.contractsState());
    callback();
  } else {

    // determine arguments
    var suppliedArgs = (params || contract.args);
    var realArgs = [];

    for (var l = 0; l < suppliedArgs.length; l++) {
      var arg = suppliedArgs[l];
      if (arg[0] === "$") {
        var contractName = arg.substr(1);
        var referedContract = this.contractsManager.getContract(contractName);
        realArgs.push(referedContract.deployedAddress);
      } else {
        realArgs.push(arg);
      }
    }

    this.deployContract(contract, realArgs, function(err, address) {
      self.deployTracker.trackContract(contract.className, contract.code, realArgs, address);
      self.deployTracker.save();
      self.logger.contractsState(self.contractsManager.contractsState());
      callback();
    });
  }

};

Deploy.prototype.deployContract = function(contract, params, callback) {
  var self = this;
  var contractObject = this.web3.eth.contract(contract.abiDefinition);

  var contractParams = (params || contract.args).slice();

  this.web3.eth.getAccounts(function(err, accounts) { 
    //console.log("using address" + this.web3.eth.accounts[0]);

    // TODO: probably needs to be defaultAccount
    // TODO: it wouldn't necessary be the first address
    // use defined blockchain address or first address
    contractParams.push({
      //from: this.web3.eth.coinbase,
      from: accounts[0],
      data: contract.code,
      gas: contract.gas,
      gasPrice: contract.gasPrice
    });

    self.logger.info("deploying " + contract.className);
    contractParams.push(function(err, transaction) {
      self.logger.contractsState(self.contractsManager.contractsState());

      if (err) {
        self.logger.error("error deploying contract: " + contract.className);
        self.logger.error(err.toString());
        callback(new Error(err));
      } else if (transaction.address !== undefined) {
        self.logger.info(contract.className + " deployed at " + transaction.address);
        contract.deployedAddress = transaction.address;
        callback(null, transaction.address);
      }
    });

    contractObject["new"].apply(contractObject, contractParams);
  });
};

Deploy.prototype.deployAll = function(done) {
  var self = this;
  this.logger.info("deploying contracts");

  async.eachOfSeries(this.contractsManager.listContracts(),
                     function(contract, key, callback) {
                       self.logger.trace(arguments);
                       self.checkAndDeployContract(contract, null, callback);
                     },
                     function(err, results) {
                       self.logger.info("finished");
                       self.logger.trace(arguments);
                       done();
                     }
                    );

};

module.exports = Deploy;

