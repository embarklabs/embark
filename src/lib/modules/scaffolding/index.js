class Scaffolding {
  constructor(embark, _options) {
    this.embark = embark;
    this.options = _options;
    this.plugins = _options.plugins;

    embark.events.setCommandHandler("scaffolding:generate:contract", (options, cb) => {
      this.framework = options.contractLanguage;
      this.fields = options.fields;
      this.generate(options.contract, options.overwrite, true, cb);
    });

    embark.events.setCommandHandler("scaffolding:generate:ui", (options, cb) => {
      this.framework = options.framework;
      this.fields = options.fields;
      this.generate(options.contract, options.overwrite, false, cb);
    });
  }

  getScaffoldPlugin(framework) {
    let dappGenerators = this.plugins.getPluginsFor('dappGenerator');
    let builder = null;
    dappGenerators.forEach((plugin) => {
      plugin.dappGenerators.forEach((d) => {
        if (d.framework === framework) {
          builder = d.cb;
        }
      });
    });
    return builder;
  }

  loadFrameworkModule() {
    switch (this.framework) {
      case 'react':
        this.plugins.loadInternalPlugin('scaffolding-react', this.options);
        break;
      case 'solidity':
        this.plugins.loadInternalPlugin('scaffolding-solidity', this.options);
        break;
      default:
        this.embark.logger.error(__('Selected framework not supported'));
        this.embark.logger.error(__('Supported Frameworks are: %s', 'react, solidity'));
        process.exit(1);
    }
  }

  generate(contractName, overwrite, isContractGeneration, cb) {
    this.loadFrameworkModule();

    const build = this.getScaffoldPlugin(this.framework);
    if (!build) {
      this.embark.logger.error("Could not find plugin for framework '" + this.framework + "'");
      process.exit(1);
    }

    const hasFields = Object.getOwnPropertyNames(this.fields).length !== 0;

    if (isContractGeneration && !hasFields) {
      // This happens when you execute "scaffold ContractName",
      // assuming the contract already exists in a .sol file
      cb();
      return;
    }

    let contract;
    if (isContractGeneration && hasFields) {
      contract = {className: contractName, fields: this.fields};
      try {
        build(contract, overwrite, cb);
      } catch (err) {
        this.embark.logger.error(err.message);
      }
    } else {
      // Contract already exists
      this.embark.events.request("contracts:list", (_err, contractsList) => {
        if (_err) throw new Error(_err);
        const contract = contractsList.find(x => x.className === contractName);
        if (!contract) {
          this.embark.logger.error("contract '" + contractName + "' does not exist");
          cb();
          return;
        }

        try {
          build(contract, overwrite, cb);
        } catch (err) {
          this.embark.logger.error(err.message);
        }
      });
    }
  }
}


module.exports = Scaffolding;
