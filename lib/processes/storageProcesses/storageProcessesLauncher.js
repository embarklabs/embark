const fs = require('../../core/fs');
const utils = require('../../utils/utils');
const ProcessLauncher = require('../../process/processLauncher');
const constants = require('../../constants');

class StorageProcessesLauncher {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.storageConfig = options.storageConfig;
    this.webServerConfig = options.webServerConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.processes = {};

    this.cors = this.buildCors();

    this.events.on('exit', () => {
      Object.keys(this.processes).forEach(processName => {
        this.processes[processName].send('exit');
      });
    });
  }

  buildCors()
  {
    let corsParts = [];
    // add our webserver CORS
    if(this.webServerConfig.enabled){
      if (this.webServerConfig && this.webServerConfig.host) {
        let port = this.webServerConfig.port ? `:${this.webServerConfig.port}` : '';
        corsParts.push(`${this.webServerConfig.protocol || 'http'}://${this.webServerConfig.host}${port}`);
      }
      else corsParts.push('http://localhost:8000');
    }

    // add all dapp connection storage 
    if(this.storageConfig.enabled) {
      this.storageConfig.dappConnection.forEach(dappConn => {
        if(dappConn.getUrl || dappConn.host){
          
          // if getUrl is specified in the config, that needs to be included in cors
          // instead of the concatenated protocol://host:port
          if(dappConn.getUrl) {
            // remove /ipfs or /bzz: from getUrl if it's there
            let getUrlParts = dappConn.getUrl.split('/');
            getUrlParts = getUrlParts.slice(0, 3);
            corsParts.push(getUrlParts.join('/'));
          }
          // use our modified getUrl or in case it wasn't specified, use a built url
          else{
            let port = dappConn.port ? `:${dappConn.port}` : '';
            corsParts.push(`${dappConn.protocol || 'http'}://${dappConn.host}${port}`);
          }
        }
      });
    }

    if(this.blockchainConfig.enabled) {
      // add our rpc endpoints to CORS
      if(this.blockchainConfig.rpcHost && this.blockchainConfig.rpcPort){
        corsParts.push(`http://${this.blockchainConfig.rpcHost}:${this.blockchainConfig.rpcPort}`);
      }

      // add our ws endpoints to CORS
      if(this.blockchainConfig.wsRPC && this.blockchainConfig.wsHost && this.blockchainConfig.wsPort){
        corsParts.push(`ws://${this.blockchainConfig.wsHost}:${this.blockchainConfig.wsPort}`);
      }
    }
    return corsParts;
  }

  processExited(storageName, code) {
    this.logger.error(__(`Storage process for ${storageName} ended before the end of this process. Code: ${code}`));
  }

  launchProcess(storageName, callback) {
    const self = this;
    if (self.processes[storageName]) {
      return callback(__('Storage process already started'));
    }
    const filePath = utils.joinPath(__dirname, `./${storageName}.js`);
    fs.access(filePath, (err) => {
      if (err) {
        return callback(__('No process file for this storage type exists. Please start the process locally.'));
      }
      self.logger.info(__(`Starting ${storageName} process`).cyan);
      self.processes[storageName] = new ProcessLauncher({
        modulePath: filePath,
        logger: self.logger,
        events: self.events,
        silent: self.logger.logLevel !== 'trace',
        exitCallback: self.processExited.bind(this, storageName)
      });
      self.processes[storageName].send({
        action: constants.blockchain.init, options: {
          storageConfig: self.storageConfig,
          cors: self.cors
        }
      });

      self.processes[storageName].on('result', constants.storage.initiated, (msg) => {
        if (msg.error) {
          self.processes[storageName].disconnect();
          delete self.processes[storageName];
          return callback(msg.error);
        }
        self.logger.info(__(`${storageName} process started`).cyan);
        callback();
      });
    });
  }
}

module.exports = StorageProcessesLauncher;
