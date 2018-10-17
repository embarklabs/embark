const fs = require('../../core/fs');
const shellJs = require('shelljs');
const utils = require('../../utils/utils');
const ProcessLauncher = require('../../core/processes/processLauncher');
const constants = require('../../constants');
const {canonicalHost} = require('../../utils/host');

let References = {
  ipfs: 'https://ipfs.io/docs/install/',
  swarm: 'http://swarm-guide.readthedocs.io/en/latest/installation.html'
};

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
        corsParts.push(utils.buildUrlFromConfig(this.webServerConfig));
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
            let host = canonicalHost(getUrlParts[2].split(':')[0]);
            let port = getUrlParts[2].split(':')[1];
            getUrlParts[2] = port ? [host, port].join(':') : host;
            corsParts.push(getUrlParts.join('/'));
          }
          // in case getUrl wasn't specified, use a built url
          else{
            corsParts.push(utils.buildUrlFromConfig(dappConn));
          }
        }
      });
    }

    if(this.blockchainConfig.enabled) {
      // add our rpc endpoints to CORS
      if(this.blockchainConfig.rpcHost && this.blockchainConfig.rpcPort){
        corsParts.push(`http://${canonicalHost(this.blockchainConfig.rpcHost)}:${this.blockchainConfig.rpcPort}`);
      }

      // add our ws endpoints to CORS
      if(this.blockchainConfig.wsRPC && this.blockchainConfig.wsHost && this.blockchainConfig.wsPort){
        corsParts.push(`ws://${canonicalHost(this.blockchainConfig.wsHost)}:${this.blockchainConfig.wsPort}`);
      }
    }
    return corsParts;
  }

  processExited(storageName, code) {
    this.logger.error(__(`Storage process for {{storageName}} ended before the end of this process. Code: {{code}}`, {storageName, code}));
  }

  launchProcess(storageName, callback) {
    const self = this;
    if (self.processes[storageName]) {
      return callback(__('Storage process already started'));
    }
    const filePath = utils.joinPath(__dirname, `../${storageName}/process.js`);
    fs.access(filePath, (err) => {
      if (err) {
        return callback(__('No process file for this storage type (%s) exists. Please start the process locally.', storageName));
      }

      let cmd = (storageName === 'swarm' ? (self.storageConfig.swarmPath || 'swarm') : 'ipfs');

      const program = shellJs.which(cmd);
      if (!program) {
        self.logger.warn(__('{{storageName}} is not installed or your configuration is not right', {storageName}).yellow);
        self.logger.info(__('You can install and get more information here: ').yellow + References[storageName].underline);
        return callback(__('%s not installed', storageName));
      }

      self.logger.info(__(`Starting %s process`, storageName).cyan);
      self.processes[storageName] = new ProcessLauncher({
        modulePath: filePath,
        logger: self.logger,
        events: self.events,
        silent: self.logger.logLevel !== 'trace',
        exitCallback: self.processExited.bind(this, storageName)
      });
      this.events.once("web3Ready", () => {
        this.events.request("blockchain:object", (blockchain) => {
          blockchain.determineDefaultAccount((err, defaultAccount) => {
            self.processes[storageName].send({
              action: constants.storage.init, options: {
                storageConfig: self.storageConfig,
                blockchainConfig: self.blockchainConfig,
                cors: self.buildCors(),
                defaultAccount: defaultAccount
              }
            });
          });
        });
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

      self.events.on('logs:swarm:enable', () => {
        self.processes[storageName].silent = false;
      });

      self.events.on('logs:swarm:disable', () => {
        self.processes[storageName].silent = true;
      });

    });
  }
}

module.exports = StorageProcessesLauncher;
