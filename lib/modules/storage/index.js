
let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let _ = require('underscore');

class Storage {
    constructor(embark, options){
        this._embark = embark;
        this._storageConfig = options.storageConfig;

        let storageProviderCls = require(`../${this._storageConfig.upload.provider}/index.js`);
        let uploadProvider = new storageProviderCls(embark, options); /*eslint no-new: "off"*/

        if(typeof uploadProvider.commandlineDeploy == 'function') uploadProvider.commandlineDeploy();
        if(typeof uploadProvider.setServiceCheck == 'function') uploadProvider.setServiceCheck();
        if(typeof uploadProvider.addObjectToConsole == 'function') uploadProvider.addObjectToConsole();
        
        // loop through all available providers and add the provider code to embarkjs
        this._storageConfig.available_providers.forEach(providerStr => {
            let storageProvider;

            // check if we've already instantiated our storage class and reuse
            if(providerStr === this._storageConfig.upload.provider){
                storageProvider = uploadProvider;
            }
            // otherwise instantiate the storage provider
            else {
                let storageProviderCls = require(`../${providerStr}/index.js`);
                storageProvider = new storageProviderCls(embark, options); /*eslint no-new: "off"*/
            }

            // add __embarkSwarm and __embarkIPFS objects to EmbarkJS
            if(typeof storageProvider.addProviderToEmbarkJS == 'function') storageProvider.addProviderToEmbarkJS();
        });
        
        // add the storage provider code (__embarkStorage) to embarkjs
        this.addProviderToEmbarkJS();

        // add the code to call setProviders in embarkjs after embark is ready
        this.addSetProviders();
    }

    addProviderToEmbarkJS(){
        // TODO: make this a shouldAdd condition
        if (this._storageConfig === {} || !this._storageConfig.dappConnection || !this._storageConfig.dappConnection.length) {
            return;
        }
    
        let code = "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
    
        this._embark.addCodeToEmbarkJS(code);
    }

    addSetProviders() {
        // TODO: make this a shouldAdd condition
        if (this._storageConfig === {} || !this._storageConfig.dappConnection || !this._storageConfig.dappConnection.length) {
          return;
        }

        // filter list of dapp connections based on available_providers set in config
        let hasSwarm = _.contains(this._storageConfig.available_providers, 'swarm'); // don't need to eval this in every loop iteration
        let connectionsToSet = _.filter(this._storageConfig.dappConnection, (conn) => {
            return _.contains(this._storageConfig.available_providers, conn.provider) || (conn === '$BZZ' && hasSwarm);
        });
    
        let code = `\n__embarkStorage.setProviders(${JSON.stringify(connectionsToSet)});`;

        let shouldInit = (storageConfig) => {
            return (connectionsToSet !== undefined && connectionsToSet.length > 0 && storageConfig.enabled === true);
        };
    
        this._embark.addProviderInit('storage', code, shouldInit);
    }
}

module.exports = Storage;
