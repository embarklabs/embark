
let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let _ = require('underscore');

class Storage {
    constructor(embark, options){
        this._storageConfig = options.storageConfig;

        let storageProviderCls = require(`../${this._storageConfig.upload.provider}/index.js`);
        this._uploadProvider = new storageProviderCls(embark, this._storageConfig); /*eslint no-new: "off"*/

        if(typeof this._uploadProvider.initProvider == 'function') this._uploadProvider.initProvider();
        if(typeof this._uploadProvider.commandlineDeploy == 'function') this._uploadProvider.commandlineDeploy();
        if(typeof this._uploadProvider.setServiceCheck == 'function') this._uploadProvider.setServiceCheck();
        if(typeof this._uploadProvider.addObjectToConsole == 'function') this._uploadProvider.addObjectToConsole();
        
        // loop through all available providers and add "register provider" code in EmbarkJS
        // which allows the provider to be set in the DApp
        this._storageConfig.available_providers.forEach(providerStr => {
            let storageProviderCls = require(`../${providerStr}/index.js`);
            this._storageProvider = new storageProviderCls(this.storageConfig); /*eslint no-new: "off"*/
            if(typeof this._storageProvider.addProviderToEmbarkJS == 'function') this._storageProvider.addProviderToEmbarkJS();
        });
        
        // add the code to call setProviders in embarkjs
        this.addSetProviders();
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
    
        let code = "";
        code += "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();
        code += `\n__embarkStorage.setProviders(${JSON.stringify(connectionsToSet)}));`;
    
        this.embark.addCodeToEmbarkJS(code);
    }
}

module.exports = Storage;
