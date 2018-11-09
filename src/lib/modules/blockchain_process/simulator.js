const path = require('path');
const pkgUp = require('pkg-up');
let shelljs = require('shelljs');
let proxy = require('./proxy');
const Ipc = require('../../core/ipc');
const constants = require('../../constants.json');
const {defaultHost, dockerHostSwap} = require('../../utils/host');
const fs = require('../../core/fs.js');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.contractsConfig = options.contractsConfig;
    this.logger = options.logger;
  }

  /*eslint complexity: ["error", 23]*/
  run(options) {
    let cmds = [];

    const ganache_main = require.resolve('ganache-cli', {paths: fs.embarkPath('node_modules')});
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
    const configPort = this.contractsConfig.deployment.type === 'rpc' ? this.blockchainConfig.rpcPort : this.blockchainConfig.wsPort;
    let port = (options.port || configPort || 8545);
    port = parseInt(port, 10) + (useProxy ? constants.blockchain.servicePortOnProxy : 0);

    cmds.push("-p " + port);
    cmds.push("-h " + host);
    cmds.push("-a " + (options.numAccounts || 10));
    cmds.push("-e " + (options.defaultBalance || 100));
    cmds.push("-l " + (options.gasLimit || this.blockchainConfig.targetGasLimit || 8000000));

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
    if (networkId) { // Don't handle networkId=="0" because it is not a valid networkId for ganache-cli.
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
