const path = require('path');
const pkgUp = require('pkg-up');
let shelljs = require('shelljs');
let proxy = require('./proxy');
const Ipc = require('../../core/ipc');
const constants = require('../../constants.json');
const {defaultHost, dockerHostSwap} = require('../../utils/host');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.logger = options.logger;
  }

  run(options) {
    let cmds = [];

    const ganache_main = require.resolve('ganache-cli');
    const ganache_json = pkgUp.sync(path.dirname(ganache_main));
    const ganache_root = path.dirname(ganache_json);
    const ganache_bin = require(ganache_json).bin;
    let ganache;
    if (typeof ganache_bin === 'string') {
      ganache = path.join(ganache_root, ganache_bin);
    } else {
      ganache = path.join(ganache_root, ganache_bin['ganache-cli']);
    }

    let useProxy = this.blockchainConfig.proxy || false;
    let host = (dockerHostSwap(options.host || this.blockchainConfig.rpcHost) || defaultHost);
    let port = (options.port || this.blockchainConfig.rpcPort || 8545);

    cmds.push("-p " + (port + (useProxy ? constants.blockchain.servicePortOnProxy : 0)));
    cmds.push("-h " + host);
    cmds.push("-a " + (options.numAccounts || 10));
    cmds.push("-e " + (options.defaultBalance || 100));
    cmds.push("-l " + (options.gasLimit || 8000000));

    // adding mnemonic only if it is defined in the blockchainConfig or options
    let simulatorMnemonic = this.blockchainConfig.simulatorMnemonic || options.simulatorMnemonic;
    if (simulatorMnemonic) {
      cmds.push("--mnemonic \"" + (simulatorMnemonic) +"\"");
    }

    // as ganache-cli documentation explains, the simulatorAccounts configuration overrides a mnemonic
    let simulatorAccounts = this.blockchainConfig.simulatorAccounts || options.simulatorAccounts;
    if (simulatorAccounts && simulatorAccounts.length > 0) {
      let web3 = new (require('web3'))();
      let AccountParser = require('../../utils/accountParser.js');
      let parsedAccounts = AccountParser.parseAccountsConfig(simulatorAccounts, web3, this.logger);
      parsedAccounts.forEach((account) => {
        let cmd = '--account="' + account.privateKey + ','+account.hexBalance + '"';
        cmds.push(cmd);
      });
    }

    // adding blocktime only if it is defined in the blockchainConfig or options
    let simulatorBlocktime = this.blockchainConfig.simulatorBlocktime || options.simulatorBlocktime;
    if (simulatorBlocktime) {
      cmds.push("-b \"" + (simulatorBlocktime) +"\"");
    }

    // Setting up network id for simulator from blockchainConfig or options.
    // Otherwise ganache-cli would make random network id.
    let networkId = this.blockchainConfig.networkId || options.networkId;
    if (typeof networkId != 'undefined') {
      cmds.push("--networkId " + networkId);
    }

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
