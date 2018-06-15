
const utils = require('../../utils/utils.js');
const fs = require('../../core/fs.js');
const _ = require('underscore');
const async = require('async');
const StorageProcessesLauncher = require('../../processes/storageProcesses/storageProcessesLauncher');
const constants = require('../../constants');

class Storage {
  constructor(embark, options){
    this._embark = embark;
    this._options = options;
    this._storageConfig = options.storageConfig;
    this._webServerConfig = options.webServerConfig;
    this._blockchainConfig = options.blockchainConfig;
    this._servicesMonitor = options.servicesMonitor;
    this._events = options.events;
    this._logger = options.logger;

    // filter list of dapp connections based on available_providers set in config
    let hasSwarm = _.contains(this._storageConfig.available_providers, 'swarm'); // don't need to eval this in every loop iteration
    // contains valid dapp storage providers
    this._validDappProviders = _.filter(this._storageConfig.dappConnection, (conn) => {
        return _.contains(this._storageConfig.available_providers, conn.provider) || (conn === '$BZZ' && hasSwarm);
    });

    this.initStorageForEmbark();
    this.initStorageForDapp();

    // don't start storage processes on build command, only on upload or run
    if(_.contains(options.context, constants.contexts.upload) || _.contains(options.context, constants.contexts.run)){
      this.startStorageProcesses();
    }
  }

  _checkStorageEndpoint(platform, callback) {
    let checkFn;
    let self = this;
    self._logger.trace(`Storage module: Checking ${platform} availability...`);
    _.find(self._servicesMonitor.checkList, (value, key) => {
      if(key.toLowerCase() === platform.toLowerCase()){
        checkFn = value;
        return true;
      }
    });
    if (!checkFn || typeof checkFn.fn !== 'function') {
      self._logger.trace(`Storage module: Check for ${platform} node does not exist.`);
      return callback();
    }

    checkFn.fn(function (serviceCheckResult) {
      if (!serviceCheckResult.status || serviceCheckResult.status === 'off') {
        self._logger.trace(`Storage module: ${platform} node not available.`);
        return callback('No node');
      }
      callback();
    });
  }
    
  _startStorageNode(platform, callback) {
    let self = this;
    const storageProcessesLauncher = new StorageProcessesLauncher({
      logger: self._logger,
      events: self._events,
      storageConfig: self._storageConfig,
      webServerConfig: self._webServerConfig,
      blockchainConfig: self._blockchainConfig
    });
    self._logger.trace(`Storage module: Launching ${platform} process...`);
    return storageProcessesLauncher.launchProcess(platform.toLowerCase(), (err) => {
      if (err) {
        return callback(err);
      }
      callback();
    });
  }

  /// Initializes a storage provider for Embark upload
  initStorageForEmbark(){
    let storageProviderCls = require(`../${this._storageConfig.upload.provider}/index.js`);
    let uploadProvider = new storageProviderCls(this._embark, this._options); /*eslint no-new: "off"*/

    if(typeof uploadProvider.commandlineDeploy == 'function') uploadProvider.commandlineDeploy();
    if(typeof uploadProvider.setServiceCheck == 'function') uploadProvider.setServiceCheck();
    if(typeof uploadProvider.addObjectToConsole == 'function') uploadProvider.addObjectToConsole();
  }

  /**
   * Initializes a storage provider for EmbarkJS
   * 
   * @return {void}
   */
  initStorageForDapp(){
    // now we need to add instantiate any dappConnection/available_providers storage providers to add
    // their provider code to embarkjs
    this._validDappProviders.forEach(dappConn => {
      if(!dappConn.provider) return;
      let storageProviderCls = require(`../${dappConn.provider}/index.js`);
      
      // override options with dappConnection settings
      let storageOptions = this._options;
      storageOptions.protocol = dappConn.protocol;
      storageOptions.host = dappConn.host;
      storageOptions.port = dappConn.port;

      // then instantiate the storage provdier class
      let storageProvider = new storageProviderCls(this._embark, storageOptions); /*eslint no-new: "off"*/

      // register the service check so we can use it to check if the process is running before spawning it
      // check that it hasn't already been done above
      if(dappConn.provider !== this._storageConfig.upload.provider){
        if(typeof storageProvider.setServiceCheck == 'function') storageProvider.setServiceCheck();
      }

      // add __embarkSwarm and __embarkIPFS objects to EmbarkJS
      if(typeof storageProvider.addProviderToEmbarkJS == 'function') storageProvider.addProviderToEmbarkJS();
    });

    // add the storage provider code (__embarkStorage) to embarkjs
    this.addProviderToEmbarkJS();

    // add the code to call setProviders in embarkjs after embark is ready
    this.addSetProviders();
  }

  /**
   * Adds the storage provider code (__embarkStorage) to embarkjs
   * 
   * @returns {void}
   */
  addProviderToEmbarkJS(){
    // TODO: make this a shouldAdd condition
    if (this._storageConfig === {} || !this._storageConfig.dappConnection || !this._storageConfig.dappConnection.length) {
      return;
    }

    let code = "\n" + fs.readFileSync(utils.joinPath(__dirname, 'embarkjs.js')).toString();

    this._embark.addCodeToEmbarkJS(code);
  }

  /**
   * Adds the code to call setProviders in embarkjs after embark is ready
   * 
   * @returns {void}
   */
  addSetProviders() {

    let code = `\n__embarkStorage.setProviders(${JSON.stringify(this._validDappProviders)});`;
    let shouldInit = (storageConfig) => {
      return (this._validDappProviders !== undefined && this._validDappProviders.length > 0 && storageConfig.enabled === true);
    };
  
    this._embark.addProviderInit('storage', code, shouldInit);
  }

  checkStorageService(platform, url, callback) {
    const self = this;

    // start the upload storage node
    self._checkStorageEndpoint(platform, function (err) {
      if (!err) {
        return callback(null);
      }
      self._startStorageNode(platform, (err) => {
        if (err) {
          return callback(err);
        }
        // Check endpoint again to see if really did start
        self._checkStorageEndpoint(platform, (err) => {
          if (err) {
            return callback(err);
          }
          callback(null);
        });
      });
    });
  }

  startStorageProcesses(){
    let platform = this._storageConfig.upload.provider;
    let self = this;
    let withErrors = false;

    async.waterfall([
      function _checkStorageService(callback){
        self.checkStorageService(platform, utils.buildUrlFromConfig(self._storageConfig.upload), (err) => {
          // log error and continue
          if(err){
            self._logger.error(err);
            withErrors = true;
          }
          callback(null);
        });
      },
      function checkDappConnectionStorageService(callback){
        // start any dappConnection storage nodes
        async.each(self._validDappProviders, function(dappConn, cb) {
          if(!dappConn.provider || dappConn.provider === platform) {
            return cb(null);
          } // don't start the process we've just started above

          self.checkStorageService(dappConn.provider, utils.buildUrlFromConfig(dappConn), (err) => {
            // log error and continue
            if(err){
              self._logger.error(err);
              withErrors = true;
            }
            cb(null);
          });
        }, callback);
      }
    ], function (){
      let strComplete = __('Finished starting all storage providers');
      if(withErrors){
        strComplete += ', ' + __('with errors.');
        return self._logger.warn(strComplete);
      }
      self._logger.info(strComplete + '.');
    });
  }
}

module.exports = Storage;
