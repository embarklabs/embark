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
    this.processes = {};
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
        silent: true,
        exitCallback: self.processExited.bind(this, storageName)
      });
      self.processes[storageName].send({
        action: constants.blockchain.init, options: {
          storageConfig: self.storageConfig,
          webServerConfig: self.webServerConfig
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
