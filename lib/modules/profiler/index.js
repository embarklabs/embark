const asciiTable = require('ascii-table');
const GasEstimator = require('./gasEstimator.js');

class Profiler {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    this.gasEstimator = new GasEstimator(embark);

    this.registerConsoleCommand();
    this.registerApi();
  }

  profile(contractName, contract, callback) {
    const self = this;
    let table = new asciiTable(contractName);
    table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
    self.gasEstimator.estimateGas(contractName, function(err, gastimates, name) {
      if (err) {
        return callback(null, "error found in method: " + name + " error: " + JSON.stringify(err));
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
      callback(null, table.toString());
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

      return {
        match: () => cmdName === 'profile',
        process: (callback) => {
          self.events.request('contracts:contract', contractName, (contract) => {
            if (!contract || !contract.deployedAddress) {
              return callback(null, "--  couldn't profile " + contractName + " - it's not deployed or could be an interface");
            }
            this.profile(contractName, contract, callback);
          });
        }
      };
    });
  }

  registerApi() {
    const self = this;

    let plugin = this.plugins.createPlugin('profiler', {});
    plugin.registerAPICall(
      'get',
      '/embark-api/profiler/:contractName',
      (req, res) => {
        let contractName = req.params.contractName;
        //self.events.request('contracts:contract', req.params.contractName, res.send.bind(res));
        self.events.request('contracts:contract', contractName, (contract) => {
          if (!contract || !contract.deployedAddress) {
            return res.send("--  couldn't profile " + contractName + " - it's not deployed or could be an interface");
          }
          self.profile(contractName, contract, (err, table) => {
            if (err) {
              return res.send(err);
            }
            res.send(table);
          });
        });
      }
    );
  }

}

module.exports = Profiler;
