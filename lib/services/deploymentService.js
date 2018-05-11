const Plugins = require('../core/plugins.js');
const Events = require('../core/events');
const Config = require('../core/config');
const ContractsManager = require('../contracts/contracts');
const DeployManager = require('../contracts/deploy_manager');
const inversify = require('inversify');

class DeploymentService {
    constructor(events, plugins, config, deployManager, contractsManager) {
        this._events = events;
        this._plugins = plugins;
        this._config = config;
        this._deployManager = deployManager;
        this._contractsManager = contractsManager;

        this._started = false;
    }
    start() {
        if(this._started) return; // run once
        this._started = true;

        let self = this;

        this._plugins.loadInternalPlugin('solidity', {
            contractDirectories: self._config.contractDirectories
        });
        this._plugins.loadInternalPlugin('vyper', {
            contractDirectories: self._config.contractDirectories
        });

        this._events.on('file-event', function (fileType) {
            // TODO: still need to redeploy contracts because the original contracts
            // config is being corrupted
            if (fileType === 'asset') {
                self.events.emit('asset-changed', self._contractsManager);
            }
            // TODO: for now need to deploy on asset chanes as well
            // because the contractsManager config is corrupted after a deploy
            if (fileType === 'contract' || fileType === 'config') {
                self._config.reloadConfig();
                self._deployManager.deployContracts(function () {
                });
            }
        });
    }
}

inversify.decorate(inversify.injectable(), DeploymentService);
inversify.decorate(inversify.inject(Events), DeploymentService, 0);
inversify.decorate(inversify.inject(Plugins), DeploymentService, 1);
inversify.decorate(inversify.inject(Config), DeploymentService, 2);
inversify.decorate(inversify.inject(DeployManager), DeploymentService, 3);
inversify.decorate(inversify.inject(ContractsManager), DeploymentService, 4);

module.exports = DeploymentService;
