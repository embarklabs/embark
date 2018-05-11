const ethers = require('ethers');

/************************************
 * This is an example of what an ether.js provider would look like
 * when used with dependency injection.
 * 
 * It has not been tested.
 */
class EthersProvider{
    constructor(config){
        this._providerObject = undefined;
        this._config = config;
    }

    get providerObject(){
        if (this._providerObject === undefined) {
            this._providerObject = ethers.providers.getDefaultProvider('ropsten');
        }
        return this._providerObject;
    }
}

module.exports = EthersProvider;
