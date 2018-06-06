const ContractFuzzer = require('../fuzzer');

class GasEstimator {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fuzzer = new ContractFuzzer(embark);
  }

  estimateGas(contractName) {
    const self = this;
    let gasMap = {};
    self.events.request('contracts:contract', contractName, (contract) => {
      self.logger.info("Generating three rounds of fuzz for contract -- ", contractName);
      let fuzzMap = self.fuzzer.generateFuzz(3, contract);
      self.logger.info("--  Beginning gastimation for contract -- " + contractName);
      let tempGasMap = {};
      for (let i = 0; i < 3; i++) {
        tempGasMap[i] = {}
        for (let name in fuzzMap[i]) {
          tempGasMap[i][name] = contract.methods[name].apply(contract.methods[name], fuzzMap[i][name]).estimateGas();
        }
      };
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
