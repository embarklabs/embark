const fs = require('fs');

const commandName = "generate-ui";

const errorMessage = (message) => new Error(commandName + ": " + message);

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

    generate(contractName){
        let frameworkPlugin;

        if(this.framework == 'react'){
            this.embark.plugins.loadInternalPlugin('scaffolding-react', this.options);
            frameworkPlugin = this.embark.plugins.plugins.filter(x => x.name == "scaffolding-react")[0].pluginModule;
        } else {
            let plugins = this.embark.plugins.getPluginsFor(this.framework);
            if(plugins.length !== 1){
                throw errorMessage("Could not find plugin for framework '" + this.framework + "'");
            }
            frameworkPlugin = plugins[0].pluginModule;
        }
        
        
        if(!this.isContract(contractName)){
            return errorMessage("contract '" + contractName + "' does not exist");
        }

        const contract = this.embark.config.contractsConfig.contracts[contractName];
        
        try {
            let uiFramework = new frameworkPlugin(this.embark, this.options);
            let result = uiFramework.build(contract);
            this.embark.logger.info(result);
        } catch(err){
            throw errorMessage(err);
        }
    }
}


module.exports = Scaffolding;
