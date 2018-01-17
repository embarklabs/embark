let shelljs = require('shelljs');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
  }

  run(options) {
    let cmds = [];

    cmds.push("-p " + (this.blockchainConfig.rpcPort || options.port || 8545));
    cmds.push("-h " + (this.blockchainConfig.rpcHost || options.host || 'localhost'));
    cmds.push("-a " + (options.numAccounts || 10));
    cmds.push("-e " + (options.defaultBalance || 100));
    cmds.push("-l " + (options.gasLimit || 8000000));

    // adding mnemonic only if it is defined in the blockchainConfig or options
    let simulatorMnemonic = this.blockchainConfig.simulatorMnemonic || options.simulatorMnemonic;
    if (simulatorMnemonic) {
      cmds.push("--mnemonic \"" + (simulatorMnemonic) +"\"");
    }

    // adding blocktime only if it is defined in the blockchainConfig or options
    let simulatorBlocktime = this.blockchainConfig.simulatorBlocktime || options.simulatorBlocktime;
    if (simulatorBlocktime) {
      cmds.push("-b \"" + (simulatorBlocktime) +"\"");
    }

    shelljs.exec('testrpc ' + cmds.join(' '), {async : true});
  }
}

module.exports = Simulator;
