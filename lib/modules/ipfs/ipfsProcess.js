const shelljs = require('shelljs');
const ProcessWrapper = require('../../process/processWrapper');
const constants = require('../../constants');

let ipfsProcess;

class IPFSProcess extends ProcessWrapper {
  constructor(_options) {
    super();

    this.startIPFSDaemon();
  }

  startIPFSDaemon() {
    shelljs.exec('ipfs daemon', (err, _stdout, _stderr) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
  }
}

process.on('message', (msg) => {
  if (msg.action === constants.blockchain.init) {
    ipfsProcess = new IPFSProcess(msg.options);
    return ipfsProcess.send({result: constants.blockchain.initiated});
  }
});
