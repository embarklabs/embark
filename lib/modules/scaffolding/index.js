class Scaffolding {
  constructor(engine, _options) {
    this.engine = engine;
    this.options = _options;
    this.plugins = _options.plugins;

    engine.events.setCommandHandler("scaffolding:generate:contract", (options, cb) => {
      this.framework = options.contractLanguage;
      this.fields = options.fields;
      this.generate(options.contract, options.overwrite, true, cb);
    });

    engine.events.setCommandHandler("scaffolding:generate:ui", (options, cb) => {
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
    }
  }

  generate(contractName, overwrite, isContractGeneration, cb) {
    this.loadFrameworkModule();

    const build = this.getScaffoldPlugin(this.framework);
    if (!build) {
      this.engine.logger.error("Could not find plugin for framework '" + this.framework + "'");
      process.exit();
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
        this.engine.logger.error(err.message);
      }
    } else {
      // Contract already exists
      this.engine.events.request("contracts:list", (_err, contractsList) => {
        if (_err) throw new Error(_err);
        const contract = contractsList.find(x => x.className === contractName);
        if (!contract) {
          this.engine.logger.error("contract '" + contractName + "' does not exist");
          cb();
          return;
        }

        try {
          build(contract, overwrite, cb);
        } catch (err) {
          this.engine.logger.error(err.message);
        }
      });
    }
  }
}


module.exports = Scaffolding;
