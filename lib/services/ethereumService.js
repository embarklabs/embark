const Plugins = require('../core/plugins.js');
const Config = require('../core/config');
const ServicesMonitor = require('../core/services_monitor');
const inversify = require('inversify');

class EthereumService {
    constructor(plugins, servicesMonitor, config, ethereumProvider) {
        this._plugins = plugins;
        this._servicesMonitor = servicesMonitor;
        this._config = config;
        this._providerObject = ethereumProvider.providerObject;

        this._started = false;
    }
    start() {
        if(this._started) return; // run once
        this._started = true;

        let self = this;
        this._servicesMonitor.addCheck('Ethereum', function (cb) {
            if (self._providerObject.currentProvider === undefined) {
                return cb({name: "No Blockchain node found", status: 'off'});
            }

            self._providerObject.eth.getAccounts(function (err, _accounts) {
                if (err) {
                    return cb({name: "No Blockchain node found", status: 'off'});
                }

                // TODO: web3_clientVersion method is currently not implemented in web3.js 1.0
                self._providerObject._requestManager.send({method: 'web3_clientVersion', params: []}, (err, version) => {
                    if (err) {
                        return cb({name: "Ethereum node (version unknown)", status: 'on'});
                    }
                    if (version.indexOf("/") < 0) {
                        return cb({name: version, status: 'on'});
                    }
                    let nodeName = version.split("/")[0];
                    let versionNumber = version.split("/")[1].split("-")[0];
                    let name = nodeName + " " + versionNumber + " (Ethereum)";

                    return cb({name: name, status: 'on'});
                });
            });
        });

        this._plugins.loadInternalPlugin('whisper', {
            addCheck: this._servicesMonitor.addCheck.bind(this._servicesMonitor),
            communicationConfig: this._config.communicationConfig,
            web3: this._providerObject
        });
    }
}

inversify.decorate(inversify.injectable(), EthereumService);
inversify.decorate(inversify.inject(Plugins), EthereumService, 0);
inversify.decorate(inversify.inject(ServicesMonitor), EthereumService, 1);
inversify.decorate(inversify.inject(Config), EthereumService, 2);
inversify.decorate(inversify.inject('EthereumProvider'), EthereumService, 3);

module.exports = EthereumService;
