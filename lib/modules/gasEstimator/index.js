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
      async.each(contract.abiDefinition.filter((x) => x.type !== "event"), 
        (abiMethod, gasCb) => {
          let name = abiMethod.name;
          if (abiMethod.type === "constructor") {
            // already provided for us
            gasMap['constructor'] = contract.gasEstimates.creation.totalCost.toString();
            gasCb(null);
          } else if (abiMethod.type === "fallback") {
            gasMap['fallback'] = contract.gasEstimates.external[""].toString();
            gasCb(null);
          } else if (abiMethod.inputs === null || abiMethod.inputs === undefined || abiMethod.inputs.length === 0) {
            // just run it and register it
            contractObj.methods[name]
            .apply(contractObj.methods[name], [])
            .estimateGas((err, gasAmount) => {
              if (err) {
                return gasCb(err);
              } else {
                gasMap[name] = gasAmount;
                gasCb(null, gasAmount, name);
              }              
            });
          } else {
            // async concatenate all the fuzz values and their gas cost outputs and check for equality
            async.concat(fuzzMap[name], (values, getVarianceCb) => {
              contractObj.methods[name].apply(contractObj.methods[name], values)
                .estimateGas((err, gasAmount) => {
                  getVarianceCb(err, [gasAmount]);
                });
              }, (err, variance) => {
                if (err) {
                  return gasCb(err);
                } else if (_.isEqual(variance[0], variance[1]) && _.isEqual(variance[1], variance[2])) {
                  gasMap[name] = variance[0];
                } else {
                  gasMap[name] = 'infinite';
                }
                gasCb();
              });    
          }
        },
        (err) => {
          if (err) return cb(err);
          cb(null, gasMap);
        }
      );
    });
  }
}

module.exports = GasEstimator;
