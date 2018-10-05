class Scaffolding {
    constructor(engine, _options){
        this.engine = engine;
        this.options = _options;
        this.plugins = _options.plugins;

        engine.events.setCommandHandler("scaffolding:generate", (options, cb) => {
            this.framework = options.framework;
            this.generate(options.contract, options.overwrite, cb);
        });
    }

    isContract(contractName){
        return this.engine.config.contractsConfig.contracts[contractName] !== undefined;
    }

    generate(contractName, overwrite, cb){
        if(this.framework === 'react'){
            this.plugins.loadInternalPlugin('scaffolding-react', this.options);
        }

        let dappGenerators = this.plugins.getPluginsFor('dappGenerator');

        let build = null;
        dappGenerators.forEach((plugin) => {
            plugin.dappGenerators.forEach((d) => {
                if(d.framework === this.framework){
                    build = d.cb;
                }
            });
        });

        if(build === null){
            this.engine.logger.error("Could not find plugin for framework '" + this.framework + "'");
            cb();
        } else if(!this.isContract(contractName)){
            this.engine.logger.error("contract '" + contractName + "' does not exist");
            cb();
        } else {
            this.engine.events.request("contracts:list", (_err, contractsList) => {
                if(_err) throw new Error(_err);

                const contract = contractsList.find(x => x.className === contractName);
                try {
                    build(contract, overwrite, cb);
                } catch(err){
                    this.engine.logger.error(err.message);
                }
            });
        }
    }
}


module.exports = Scaffolding;
