let shelljs = require('shelljs');
let proxy = require('../core/proxy');
const Ipc = require('../core/ipc');
const constants = require('../constants.json');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.logger = options.logger;
  }

  run(options) {
    let cmds = [];

    const ganache = shelljs.which('ganache-cli-embark');
    // const testrpc = shelljs.which('testrpc');
    // const ganache = shelljs.which('ganache-cli');
    // if (!testrpc && !ganache) {
    //   this.logger.warn(__('%s is not installed on your machine', 'Ganache CLI (TestRPC)'));
    //   this.logger.info(__('You can install it by running: %s', 'npm -g install ganache-cli'));
    //   process.exit();
    // }

    let useProxy = this.blockchainConfig.proxy || false;
    let host = (options.host || this.blockchainConfig.rpcHost || 'localhost');
    let port = (options.port || this.blockchainConfig.rpcPort || 8545);

    cmds.push("-p " + (port + (useProxy ? constants.blockchain.servicePortOnProxy : 0)));
    if (!ganache) {
      cmds.push("-h " + host);
    }
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

    // const programName = ganache ? 'ganache-cli' : 'testrpc';
    // const program = ganache ? ganache : testrpc;
    const programName = 'ganache-cli';
    const program = ganache;
    console.log(`running: ${programName} ${cmds.join(' ')}`);
    shelljs.exec(`${program} ${cmds.join(' ')}`, {async : true});

    if(useProxy){
      let ipcObject = new Ipc({ipcRole: 'client'});
      proxy.serve(ipcObject, host, port, false);
    }
    
  }
}

module.exports = Simulator;
