const async = require('async');
const ContractFuzzer = require('./fuzzer.js');
const Web3 = require('web3');

export const GAS_ERROR = '   -ERROR-   ';
export const EVENT_NO_GAS = '   -EVENT-   ';

export class GasEstimator {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fuzzer = new ContractFuzzer(embark);
  }

  printError(message, name, values = []) {
    this.logger.error(`Error getting gas estimate for "${name}(${Object.values(values).join(",")})"`, message);
    if (message.includes('always failing transaction')) {
      this.logger.error(`This may mean function assertions (revert, assert, require) are preventing the estimate from completing. Gas will be listed as "${GAS_ERROR}" in the profile.`);
    }
    this.logger.error(''); // new line to separate likely many lines
  }

  estimateGas(contractName, cb) {
    const self = this;
    let gasMap = {};
    self.events.request("blockchain:client:provider", "ethereum", (err, provider) => {
      const web3 = new Web3(provider);
      self.events.request('contracts:contract', contractName, (err, contract) => {
        if (err) return cb(err);
        let fuzzMap = self.fuzzer.generateFuzz(3, contract);
        let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.deployedAddress);
        async.each(contract.abiDefinition,
          (abiMethod, gasCb) => {
            let name = abiMethod.name;
            if (abiMethod.type === "constructor") {
              // already provided for us
              gasMap['constructor'] = parseFloat(contract.gasEstimates.creation.totalCost.toString());
              return gasCb(null, name, abiMethod.type);
            } else if (abiMethod.type === "event") {
              gasMap[name] = EVENT_NO_GAS;
              return gasCb(null, name, abiMethod.type);
            } else if (abiMethod.type === "fallback") {
              gasMap['fallback'] = parseFloat(contract.gasEstimates.external[""].toString());
              return gasCb(null, name, abiMethod.type);
            } else if (
              (abiMethod.inputs === null || abiMethod.inputs === undefined || abiMethod.inputs.length === 0)
            ) {
              // just run it and register it
              contractObj.methods[name]
              .apply(contractObj.methods[name], [])
                .estimateGas({ from: web3.eth.defaultAccount }, (err, gasAmount) => {
                if (err) {
                  self.printError(err.message || err, name);
                  return gasCb(null, name, abiMethod.type);
                }
                gasMap[name] = gasAmount;
                return gasCb(null, name, abiMethod.type);
              });
            } else {
              // async concatenate all the fuzz values and their gas cost outputs and check for equality
              async.concat(fuzzMap[name], (values, getVarianceCb) => {
                contractObj.methods[name].apply(contractObj.methods[name], values)
                  .estimateGas((err, gasAmount) => {
                    if (err) {
                      self.printError(err.message || err, name, values);
                    }
                    getVarianceCb(null, gasAmount);
                  });
                }, (err, variance) => {
                  if (variance.every(v => v === variance[0])) {
                    gasMap[name] = variance[0] ?? GAS_ERROR;
                  } else {
                    // get average
                    let sum = variance.reduce(function(memo, num) { return memo + num; });
                    gasMap[name] = sum / variance.length;
                  }
                  return gasCb(null, name, abiMethod.type);
                });
            }
          },
          (err, name, type) => {
            if (err) {
              if (type === "constructor" || type === "fallback") name = type;
              return cb(err, null, name);
            }
            cb(null, gasMap, null);
          }
        );
      });
    });
  }
}
