const async = require('async');
const _ = require('underscore');
const ContractFuzzer = require('../fuzzer');

/*global web3*/

class GasEstimator {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fuzzer = new ContractFuzzer(embark);
  }

  estimateGas(contractName, cb) {
    const self = this;
    let gasMap = {};
    self.events.request('contracts:contract', contractName, (contract) => {
      self.logger.info("Generating three rounds of fuzz for contract -- ", contractName);
      let fuzzMap = self.fuzzer.generateFuzz(3, contract);
      self.logger.info("--  Beginning gastimation for contract -- " + contractName);
      let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.deployedAddress);
      async.each(contract.abiDefinition, function(abiMethod, gasCb) => {
          let name = abiMethod.name;
          if (abiMethod.type === "constructor") {
            // already provided for us
             gasCb(null, 'constructor', contract.gasEstimates.creation.totalCost);
          } else if (abiMethod.inputs.length === 0) {
            // just run it and register it
            contractObj.methods[name]
            .apply(contractObj.methods[name], [])
            .estimateGas(function(err, gasAmount) {
              gasCb(err, gasAmount, name);
            });
        } else {
          // async concatenate all the fuzz values and their gas cost outputs and check for equality
          async.concat(fuzzMap[name], function(values, getVarianceCb) {
            contractObj.methods[name]
              .apply(contractObj.methods[name], values)
              .estimateGas(function(err, gasAmount) {
                getVarianceCb(err, [gasAmount]);
              });
            }, function(err, variance) {
              if (err) gasCb(err)
              else if (variance.reduce(_.isEqual) gasCb(null, variance[0], name);
              gasCb(null, 'variable', name);
            });    
          });
        },
        function(err, gasAmount, name) => {
          if (err) return cb(err);
          gasMap[name] = gasAmount;
        }
    });
  }
}

module.exports = GasEstimator;
