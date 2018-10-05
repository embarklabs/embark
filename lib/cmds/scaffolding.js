class Scaffolding {
    constructor(engine, options){
        this.engine = engine;
        this.options = options;
        this.framework = options.framework;
        this.frameworkPlugin = null;
    }

    isContract(contractName){
        return this.engine.config.contractsConfig.contracts[contractName] !== undefined;
    }

    generate(contractName, overwrite){
        if(this.framework === 'react'){
            this.engine.plugins.loadInternalPlugin('scaffolding-react', this.options);
        }

        let dappGenerators = this.engine.plugins.getPluginsFor('dappGenerator');

        let build = null;
        dappGenerators.forEach((plugin) => {
            plugin.dappGenerators.forEach((d) => {
                if(d.framework === this.framework){
                    build = d.cb;
                }
            });
        });

        if(build === null){
            throw new Error("Could not find plugin for framework '" + this.framework + "'");
        }

        if(!this.isContract(contractName)){
            throw new Error("contract '" + contractName + "' does not exist");
        }

        this.engine.events.request("contracts:list", (_err, contractsList) => {
            if(_err) throw new Error(_err);

            const contract = contractsList.find(x => x.className === contractName);
            try {
                build(contract, overwrite);
                this.engine.logger.info(__("finished generating the UI").underline);
            } catch(err){
                this.engine.logger.error(err.message);
            }
        });
    }
}


module.exports = Scaffolding;
