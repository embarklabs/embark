const fs = require('fs');

const commandName = "generate-ui";

const formatReplyMsg = (message) => commandName + ": " + message;

class Scaffolding {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
        this.framework = options.framework;
        this.frameworkPlugin = null;
    }

    createDirectories(contractName){
        const dir = './app/' + contractName;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        } else {
            throw formatReplyMsg("directory ./app/" + contractName + " already exists");
        }
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
                return formatReplyMsg("Could not find plugin for framework '" + this.framework + "'");
            }
            frameworkPlugin = plugins[0].pluginModule;
        }
        
        try {
            if(!this.isContract(contractName)){
                return formatReplyMsg("contract '" + contractName + "' does not exist");
            }

            const contract = this.embark.config.contractsConfig.contracts[contractName];
            
            this.createDirectories(contractName);
            let uiFramework = new frameworkPlugin(this.embark, this.options);
            uiFramework.build(contract);
        } catch(err){
            return err;
        }

        return formatReplyMsg("done!");
    }
}


module.exports = Scaffolding;
