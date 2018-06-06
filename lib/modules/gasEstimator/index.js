const ContractFuzzer = require('../fuzzer');

class GasEstimator {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fuzzer = new ContractFuzzer(embark);
  }

  estimateGas(contractName) {
    let gasMap = {};
    this.logger.info("Generating three rounds of fuzz for contract -- ", contractName);
    let fuzzMap = this.fuzzer.generateFuzz(3, contractName);
    self.events.request('contracts:contract', contractName, (contract) => {
      self.logger.info("--  Beginning gastimation for contract -- " + contractName);
      tempGasMap = {};
      fuzzMap.forEach((name) => {
        for (let i in fuzzMap[name]) {
          tempGasMap[name][i] = contract.methods[name].apply(contract.methods[name], fuzzMap[name][i]).estimateGas();
        }
      });
      tempGasMap.forEach((name) => {
        if (name === "constructor") {
          gasMap[name] = contract.gasEstimates.creation.totalCost;
        } else if (tempGasMap[name][0] !== tempGasMap[name][1] && tempGasMap[name][1] !== tempGasMap[name][2]) {
          gasMap[name] = 'variable';
        } else {
          gasMap[name] = tempGasMap[name][0];
        }
      });
      return gasMap;
    });
  }
}

module.exports = GasEstimator;
