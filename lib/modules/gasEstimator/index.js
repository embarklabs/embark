const ContractFuzzer = require('../fuzzer');

/*global web3*/

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
      let contractObj = new web3.eth.Contract(contract.abiDefinition, contract.deployedAddress);
      for (let i = 0; i < 3; i++) {
        tempGasMap[i] = {};
        for (let name in fuzzMap[i]) {
          tempGasMap[i][name] = contractObj.methods[name]
            .apply(contractObj.methods[name], fuzzMap[i][name])
            .estimateGas()
            .then(estimatedGas => estimatedGas)
            .catch(err => err);
        }
      }
      contract.abiDefinition.forEach((abiMethod) => {
        let name = abiMethod.name;
        console.log("estimaticating the gas for method name: ", name);
        if (abiMethod.type === "constructor") {
          gasMap[name] = contract.gasEstimates.creation.totalCost;
        } else if (abiMethod.inputs.length === 0) {
          gasMap[name] = contractObj.methods[name].apply(contractObj.methods[name], []).estimateGas()
            .then(estimatedGas => estimatedGas)
            .catch(err => err);
        } else if (tempGasMap[0][name] !== tempGasMap[1][name] && tempGasMap[1][name] !== tempGasMap[2][name]) {
          gasMap[name] = 'variable';
        } else {
          gasMap[name] = tempGasMap[name][0];
        }
        console.log("Estimate Gas ForEAch: ", gasMap[name]);
      });
      return gasMap;
    });
  }
}

module.exports = GasEstimator;
