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

  profileJSON(contractName, returnCb) {
    const self = this;

    let profileObj = {};
    profileObj.name = contractName;
    profileObj.methods = [];

    self.events.request('contracts:contract', contractName, (contract) => {
      if (!contract || !contract.deployedAddress) {
        return returnCb("--  couldn't profile " + contractName + " - it's not deployed or could be an interface");
      }
      self.gasEstimator.estimateGas(contractName, function(_err, gastimates, _name) {
        contract.abiDefinition.forEach((abiMethod) => {
          let methodName = abiMethod.name;
          if (['constructor', 'fallback'].indexOf(abiMethod.type) >= 0) {
            methodName = abiMethod.type;
          }

          profileObj.methods.push({
            name: methodName,
            payable: abiMethod.payable,
            mutability: abiMethod.stateMutability,
            inputs: abiMethod.inputs || [],
            outputs: abiMethod.outputs || [],
            gasEstimates: gastimates && gastimates[methodName]
          });
        });

        returnCb(null, profileObj);
      });
    });
  }

  profile(contractName, returnCb) {
    const self = this;

    this.profileJSON(contractName, (err, profileObj) => {
      if (err) {
        return returnCb(err);
      }

      let table = new asciiTable(contractName);
      table.setHeading('Function', 'Payable', 'Mutability', 'Inputs', 'Outputs', 'Gas Estimates');
      profileObj.methods.forEach((method) => {
        table.addRow(method.name, method.payable, method.mutability, self.formatParams(method.inputs), self.formatParams(method.outputs), method.gasEstimates);
      });
      return returnCb(null, table.toString());
    });
  }

  formatParams(params) {
    return "(" + (params || []).map(param => param.type).join(',') + ")";
  }

  registerConsoleCommand() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      let cmdName = cmd.split(' ')[0];
      let contractName = cmd.split(' ')[1];

      return {
        match: () => cmdName === 'profile',
        process: (callback) => {
          this.profile(contractName, callback);
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

        self.profileJSON(contractName, (err, table) => {
          if (err) {
            return res.send({error: err.message});
          }
          res.send(table);
        });
      }
    );
  }

}

module.exports = Profiler;
