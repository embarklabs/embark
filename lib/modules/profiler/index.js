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

    this.profileJSON(contractName, contract, (err, profileObj) => {
      if (err) {
        return callback(null, "error found in method: " + name + " error: " + JSON.stringify(err));
      }

      let table = new asciiTable(contractName);
      table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
      profileObj.methods.forEach((method) => {
        table.addRow(method.name, method.payable, method.mutability, method.inputs, method.outputs, method.gasEstimates);
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
        self.events.request('contracts:contract', contractName, (contract) => {
          if (!contract || !contract.deployedAddress) {
            return res.send({error: "--  couldn't profile " + contractName + " - it's not deployed or could be an interface"});
          }
          self.profile(contractName, contract, (err, table) => {
            if (err) {
              return res.send({error: err});
            }
            res.send(table);
          });
        });
      }
    );
  }

}

module.exports = Profiler;
