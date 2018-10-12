class Scaffolding {
    constructor(engine, _options){
        this.engine = engine;
        this.options = _options;
        this.plugins = _options.plugins;

        engine.events.setCommandHandler("scaffolding:generate", (options, cb) => {
            this.framework = options.framework;
            this.fields = options.fields;
            this.generate(options.contract, options.overwrite, false, cb);
        });

        engine.events.setCommandHandler("scaffolding:generate:contract", (options, cb) => {
            this.framework = options.contractLanguage;
            this.fields = options.fields;
            this.generate(options.contract, options.overwrite, true,  cb);        
        });
    }

    isContract(contractName){
        return this.engine.config.contractsConfig.contracts[contractName] !== undefined;
    }

    getScaffoldPlugin(framework){
        let dappGenerators = this.plugins.getPluginsFor('dappGenerator');
        let builder;
        dappGenerators.forEach((plugin) => {
            plugin.dappGenerators.forEach((d) => {
                if(d.framework === framework){
                    builder = d.cb;
                }
            });
        });
        return builder;
    }

    generate(contractName, overwrite, preDeployment, cb){

        switch(this.framework){
            case 'react':
                this.plugins.loadInternalPlugin('scaffolding-react', this.options);
                break;
            case 'solidity':
                this.plugins.loadInternalPlugin('scaffolding-solidity', this.options);
                break;
            default:
        }

        const fields = this.fields;

        let build = this.getScaffoldPlugin(this.framework);
        if(!build){
            this.engine.logger.error("Could not find plugin for framework '" + this.framework + "'");
            process.exit();
            cb();
        } else if(!this.isContract(contractName) && Object.getOwnPropertyNames(this.fields).length === 0){
            this.engine.logger.error("contract '" + contractName + "' does not exist");
            cb();
        } else if(preDeployment) {
            build({contract: {className: contractName}, fields}, overwrite, cb);
        } else {
            // Contract exists
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
