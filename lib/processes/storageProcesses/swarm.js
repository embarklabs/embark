const shelljs = require('shelljs');
const ProcessWrapper = require('../../process/processWrapper');
const constants = require('../../constants');

let swarmProcess;

class SwarmProcess extends ProcessWrapper {
  constructor(options) {
    super();
    this.storageConfig = options.storageConfig;
  }

  startSwarmDaemon() {
    if (!this.storageConfig.account || !this.storageConfig.account.address || !this.storageConfig.password) {
      return 'Account address and password are needed in the storage config to start the Swarm process';
    }
    shelljs.exec(`${this.storageConfig.swarmPath || 'swarm'} --bzzaccount ${this.storageConfig.account.address} --password ${this.storageConfig.password}`, {silent: true}, (err, _stdout, _stderr) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.storage.init) {
    swarmProcess = new SwarmProcess(msg.options);
    const error = swarmProcess.startSwarmDaemon();

    swarmProcess.send({result: constants.storage.initiated, error});
  }
});
