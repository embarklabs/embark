let shelljs = require('shelljs');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
  }

  run(options) {
    let cmds = [];

    cmds.push("-p " + (this.blockchainConfig.rpcPort || options.port || 8545));
    cmds.push("-h " + (this.blockchainConfig.rpcHost || options.host || 'localhost'));
    cmds.push("-a " + (options.num || 10));

    shelljs.exec('testrpc ' + cmds.join(' '), {async : true});
  }
}

module.exports = Simulator;

