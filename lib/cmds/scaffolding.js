class Scaffolding {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
        this.framework = options.framework;
        this.frameworkPlugin = null;
    }

    isContract(contractName){
        return this.embark.config.contractsConfig.contracts[contractName] !== undefined;
    }

    generate(contractName, contractConfiguration){
        if(this.framework == 'react'){
            this.embark.plugins.loadInternalPlugin('scaffolding-react', this.options);
        }

        let dappGenerators = this.embark.plugins.getPluginsFor('dappGenerator');
        let build = null;
        dappGenerators.forEach((plugin) => {
            plugin.dappGenerators.forEach((d) => {
                if(d.framework == this.framework){
                    build = d.cb;
                }
            });
        });

        if(build === null){
            throw new Error("Could not find plugin for framework '" + this.framework + "'");
        }

        if(!this.isContract(contractName)){
            return new Error("contract '" + contractName + "' does not exist");
        }

        const contract = contractConfiguration.contracts[contractName];
        const result = build(contract);
        this.embark.logger.info(result);
    }
}


module.exports = Scaffolding;
