const async = require('async');
const _ = require('underscore');
const Plugins = require('../core/plugins.js');
const Events = require('../core/events');
const Logger = require('../core/logger');
const Config = require('../core/config');
const ServicesMonitor = require('../core/services_monitor');
const DeployManager = require('../contracts/deploy_manager');
const inversify = require('inversify');

class Upload {

    constructor(logger, events, config, plugins, servicesMonitor, deployManager, platform) { //libraryManager, , web3, codeGenerator, deployment, platform) {
        //this.engine = engine;
        this._logger = logger;
        this._events = events;
        this._config = config;
        this._plugins = plugins;
        this._servicesMonitor = servicesMonitor;
        this._platform = platform;
        this._deployManager = deployManager;
    }

    run() {
        let cmdPlugin;
        let self = this;
        async.waterfall([

            function checkStorageService(callback) {
                let checkFn;
                _.find(self._servicesMonitor.checkList, (value, key) => {
                    if (key.toLowerCase() === self._platform.toLowerCase()) {
                        checkFn = value;
                        return true;
                    }
                });
                if (!checkFn || typeof checkFn.fn !== 'function') {
                    return callback();
                }
                checkFn.fn(function (serviceCheckResult) {
                    if (!serviceCheckResult.status || serviceCheckResult.status === 'off') {
                        return callback({message: `Cannot upload: ${this._platform} node is not running on http://${this._config.storageConfig.host}:${this._config.storageConfig.port}.`});
                    }
                    callback();
                });
            },
            function setupStoragePlugin(callback) {
                let pluginList = self._plugins.listPlugins();
                if (pluginList.length > 0) {
                    self._logger.info("loaded plugins: " + pluginList.join(", "));
                }

                // check use has input existing storage plugin
                let cmdPlugins = self._plugins.getPluginsFor('uploadCmds');

                if (cmdPlugins.length > 0) {
                    cmdPlugin = cmdPlugins.find((pluginCmd) => {
                        return pluginCmd.uploadCmds.some(uploadCmd => {
                            return uploadCmd.cmd === self._platform;
                        });
                    });
                }
                if (!cmdPlugin) {
                    self._logger.info('try "embark upload ipfs" or "embark upload swarm"'.green);
                    return callback({message: 'unknown platform: ' + self._platform});
                }
                callback();
            },
            function deploy(callback) {
                // 2. upload to storage (outputDone event triggered after webpack finished)
                self._events.on('outputDone', function () {
                    cmdPlugin.uploadCmds[0].cb()
                        .then((success) => {
                            callback(null, success);
                        })
                        .catch(callback);
                });
                // 1. build the contracts and dapp webpack
                self._deployManager.deployContracts(function (err) {
                    this.logger.info("finished deploying".underline);
                    if (err) {
                        callback(err);
                    }
                });
            }
        ], function (err, _result) {
            if (err) {
                self._logger.error(err.message);
                self._logger.debug(err.stack);
            } else {
                self._logger.info(`finished building DApp and deploying to ${self._platform}`.underline);
            }

            // needed due to child processes
            process.exit();
        });
    }
}

inversify.decorate(inversify.injectable(), Upload);
inversify.decorate(inversify.inject(Logger), Upload, 0);
inversify.decorate(inversify.inject(Events), Upload, 1);
inversify.decorate(inversify.inject(Config), Upload, 2);
inversify.decorate(inversify.inject(Plugins), Upload, 3);
inversify.decorate(inversify.inject(ServicesMonitor), Upload, 4);
inversify.decorate(inversify.inject(DeployManager), Upload, 5);
inversify.decorate(inversify.inject('platform'), Upload, 6);

module.exports = Upload;
