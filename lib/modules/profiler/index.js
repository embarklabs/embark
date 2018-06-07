const asciiTable = require('ascii-table');
const GasEstimator = require('../gasEstimator');

class Profiler {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.gasEstimator = new GasEstimator(embark);

    this.registerConsoleCommand();
  }

  profile(contractName, contract) {
    const self = this;
    let table = new asciiTable(contractName);
    table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
    let gastimates = self.gasEstimator.estimateGas(contractName);
    contract.abiDefinition.forEach((abiMethod) => {
      console.log("Abi Method Gastimate: ", gastimates[abiMethod.name]);
      switch(abiMethod.type) {
        case "constructor": 
          table.addRow("constructor", abiMethod.payable, abiMethod.stateMutability, this.formatParams(abiMethod.inputs), this.formatParams(abiMethod.outputs), gastimates['constructor']);
          break;
        default:
          table.addRow(abiMethod.name, abiMethod.payable, abiMethod.stateMutability, this.formatParams(abiMethod.inputs), this.formatParams(abiMethod.outputs), gastimates[abiMethod.name]);
      }
    });
    self.logger.info(table.toString());
  }

  formatParams(params) {
    if (!params || !params.length) {
      return "()";
    }
    let paramString = "(";
    let mappedParams = params.map(param => param.type);
    paramString += mappedParams.join(',');
    paramString += ")";
    return paramString;
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(' ')[0];
      let contractName = cmd.split(' ')[1];
      if (cmdName === 'profile') {
          self.events.request('contracts:contract', contractName, (contract) => {
               self.logger.info("--  profile for " + contractName);
               this.profile(contractName, contract);
          });
          return "";
      }
      return false;
    });
  }
}

module.exports = Profiler;
