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
    console.log(this.storageConfig);
    if (!this.storageConfig.account || !this.storageConfig.account.address || !this.storageConfig.account.password) {
      return 'Account address and password are needed in the storage config to start the Swarm process';
    }
    const child = shelljs.exec(
      `${this.storageConfig.swarmPath || 'swarm'} --bzzaccount ${this.storageConfig.account.address} --password ${this.storageConfig.account.password} --corsdomain http://localhost:8000 --ens-api ''`,
      {silent: true}, (err, _stdout, _stderr) => 
    {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
    let lastMessage;
    child.stdout.on('data', (data) => {
      if (!self.readyCalled && data.indexOf('Swarm http proxy started') > -1) {
        self.readyCalled = true;
        self.send({result: constants.storage.initiated});
      }
      lastMessage = data;
      console.log('Swarm: ' + data);
    });
    child.on('exit', (code) => {
      if (code) {
        console.error('Swarm exited with error code ' + code);
        console.error(lastMessage);
      }
    });
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.storage.init) {
    swarmProcess = new SwarmProcess(msg.options);
    const error = swarmProcess.startSwarmDaemon();

    if (error) {
      swarmProcess.send({result: constants.storage.initiated, error});
    }
  }
});
