const shelljs = require('shelljs');
const ProcessWrapper = require('../../process/processWrapper');
const constants = require('../../constants');

let ipfsProcess; // eslint-disable-line no-unused-vars

class IPFSProcess extends ProcessWrapper {
  constructor(_options) {
    super();

    this.checkIPFSVersion();
    this.startIPFSDaemon();
  }

  checkIPFSVersion() {
    shelljs.exec('ipfs --version', {silent: true}, (err, stdout, _stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      const match = stdout.match(/[0-9]+\.[0-9]+\.[0-9]+/);
      if (match[0]) {
        const versions = match[0].split('.');
        if (versions[0] <= 0 && versions[1] <= 4 && versions[2] <= 14) {
          console.error(`You are using IPFS version ${match[0]} which has an issue with processes.`);
          console.error(`Please update to IPFS version 0.4.15 or more recent: https://github.com/ipfs/ipfs-update`);
        }
      }
    });
  }

  startIPFSDaemon() {
    const self = this;
    const child = shelljs.exec('ipfs daemon', {silent: true}, (err, _stdout, _stderr) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
    let lastMessage;
    child.stdout.on('data', (data) => {
      if (!self.readyCalled && data.indexOf('Daemon is ready') > -1) {
        self.readyCalled = true;
        self.send({result: constants.storage.initiated});
      }
      lastMessage = data;
      console.log('IPFS: ' + data);
    });
    child.on('exit', (code) => {
      if (code) {
        console.error('IPFS exited with error code ' + code);
        console.error(lastMessage);
      }
    });
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.storage.init) {
    ipfsProcess = new IPFSProcess(msg.options);
  }
});
