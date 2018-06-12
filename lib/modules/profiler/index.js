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
    self.gasEstimator.estimateGas(contractName, function(err, gastimates) {
      if (err) {
        self.logger.error(err);
        return;
      }
      contract.abiDefinition.forEach((abiMethod) => {
        switch(abiMethod.type) {
          case "constructor": 
            table.addRow("constructor", abiMethod.payable, abiMethod.stateMutability, self.formatParams(abiMethod.inputs), self.formatParams(abiMethod.outputs), gastimates['constructor']);
            break;
          case "fallback":
            table.addRow("fallback", abiMethod.payable, abiMethod.stateMutability, self.formatParams(abiMethod.inputs), self.formatParams(abiMethod.outputs), gastimates['fallback']);
            break;
          default:
            table.addRow(abiMethod.name, abiMethod.payable, abiMethod.stateMutability, self.formatParams(abiMethod.inputs), self.formatParams(abiMethod.outputs), gastimates[abiMethod.name]);
        }
      });
      self.logger.info(table.toString());
    });
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
          if (!contract.deployedAddress) {
            self.logger.info("--  couldn't profile " + contractName + " - it's not deployed or could be an interface");
            return "";
          }
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
