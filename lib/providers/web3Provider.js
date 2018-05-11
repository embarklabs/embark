const Web3 = require('web3');
const Config = require('../core/config');
const inversify = require('inversify');

class Web3Provider{
    constructor(config){
        this._config = config;
        this._providerObject = undefined;
    }

    get providerObject(){
        if (this._providerObject === undefined) {
            this._providerObject = new Web3();
            if (this._config.contractsConfig.deployment.type === "rpc") {
                let web3Endpoint = 'http://' + this._config.contractsConfig.deployment.host + ':' + this._config.contractsConfig.deployment.port;
                this._providerObject.setProvider(new this._providerObject.providers.HttpProvider(web3Endpoint));
            } else {
                throw new Error("contracts config error: unknown deployment type " + this._config.contractsConfig.deployment.type);
            }
        }
        return this._providerObject;
    }
}

inversify.decorate(inversify.injectable(), Web3Provider);
inversify.decorate(inversify.inject(Config), Web3Provider, 0);

module.exports = Web3Provider;
