require('ejs');

const Templates = {
  vanilla_contract: require('./vanilla-contract.js.ejs')
};

// TODO: this should be moved to the embark-web3 module from master
class Web3Plugin {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.plugins = options.plugins;
    let plugin = this.plugins.createPlugin('web3plugin', {});

    plugin.registerActionForEvent("deploy:contract:deployed", (params, cb) => {
      let contract = params.contract;
      let abi = JSON.stringify(contract.abiDefinition);
      let gasLimit = 6000000;
      let contractCode = Templates.vanilla_contract({className: contract.className, abi: abi, contract: contract, gasLimit: gasLimit});

      this.events.request('runcode:eval', contractCode, (err) => {
        if (err) {
          return cb(err);
        }
        this.events.request('runcode:eval', contract.className, (err, result) => {
          if (err) {
            return cb(err);
          }
          this.events.emit("runcode:register", contract.className, result, () => { cb() });
        });
      });
    })
  }

}

module.exports = Web3Plugin;
