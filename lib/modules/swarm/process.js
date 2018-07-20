const child_process = require('child_process');
const ProcessWrapper = require('../../processes/processWrapper');
const constants = require('../../constants');
const fs = require('../../core/fs');

let swarmProcess;

class SwarmProcess extends ProcessWrapper {
  constructor(options) {
    super();
    this.storageConfig = options.storageConfig;
    this.cors = options.cors;
    this.command = this.storageConfig.swarmPath || 'swarm';
  }

  startSwarmDaemon() {
    const self = this;
    if (!this.storageConfig.account || !this.storageConfig.account.address || !this.storageConfig.account.password) {
      return 'Account address and password are needed in the storage config to start the Swarm process';
    }

    const args = [
        `--bzzaccount=${this.storageConfig.account.address}`,
        `--password=${fs.dappPath(this.storageConfig.account.password)}`,
        `--corsdomain=${self.cors.join(',')}`
      ];
    console.trace('Starting swarm process with arguments: ' + args.join(' '));
    this.child = child_process.spawn(this.command, args);

    this.child.on('error', (err) => {
      err = err.toString();
      console.error('Swarm error: ', err);
    });
    this.child.stdout.on('data', (data) => {
      data = data.toString();
      console.log(`Swarm error: ${data}`);
    });
    // Swarm logs appear in stderr somehow
    this.child.stderr.on('data', (data) => {
      data = data.toString();
      if (!self.readyCalled && data.indexOf('Swarm http proxy started') > -1) {
        self.readyCalled = true;
        self.send({result: constants.storage.initiated});
      }
      console.log('Swarm: ' + data);
    });
    this.child.on('exit', (code) => {
      if (code) {
        console.error('Swarm exited with error code ' + code);
      }
    });
  }

  kill() {
    if (this.child) {
      this.child.kill();
    }
  }
}

process.on('message', (msg) => {
  if (msg === 'exit') {
    return swarmProcess.kill();
  }
  if (msg.action === constants.storage.init) {
    swarmProcess = new SwarmProcess(msg.options);
    const error = swarmProcess.startSwarmDaemon();

    if (error) {
      swarmProcess.send({result: constants.storage.initiated, error});
    }
  }
});
