const path = require('path');
const pkgUp = require('pkg-up');
let shelljs = require('shelljs');
import {AccountParser, dappPath, defaultHost, dockerHostSwap, embarkPath} from 'embark-utils';

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.logger = options.logger;
  }

  /*eslint complexity: ["error", 26]*/
  run(options) {
    const cmds = [];

    const host = (dockerHostSwap(options.host || this.blockchainConfig.rpcHost) || defaultHost);
    const configPort = this.blockchainConfig.wsRPC ? this.blockchainConfig.wsPort : this.blockchainConfig.rpcPort;
    let port = parseInt((options.port || configPort || 8545), 10);

    cmds.push("-p " + port);
    cmds.push("-h " + host);
    cmds.push("-l " + (options.gasLimit || this.blockchainConfig.targetGasLimit || 8000000));

    // adding mnemonic only if it is defined in the blockchainConfig or options
    let mnemonicAccount = this.blockchainConfig.accounts ? this.blockchainConfig.accounts.find(acc => acc.mnemonic) : {};
    mnemonicAccount = mnemonicAccount || {};
    const simulatorMnemonic = mnemonicAccount.mnemonic || options.simulatorMnemonic;

    if (simulatorMnemonic) {
      cmds.push("--mnemonic \"" + (simulatorMnemonic) + "\"");
    }
    cmds.push("-a " + (options.numAccounts || mnemonicAccount.numAddresses || 10));
    cmds.push("-e " + (options.defaultBalance || mnemonicAccount.balance || 100));

    // as ganache-cli documentation explains, the simulatorAccounts configuration overrides a mnemonic
    let simulatorAccounts = this.blockchainConfig.simulatorAccounts || options.simulatorAccounts;
    if (simulatorAccounts && simulatorAccounts.length > 0) {
      let web3 = new (require('web3'))();
      let parsedAccounts;
      try {
        parsedAccounts = AccountParser.parseAccountsConfig(simulatorAccounts, web3, dappPath(), this.logger);
      } catch (e) {
        this.logger.error(e.message);
        process.exit(1);
      }
      parsedAccounts.forEach((account) => {
        let cmd = '--account="' + account.privateKey + ',' + account.hexBalance + '"';
        cmds.push(cmd);
      });
    }

    // adding blocktime only if it is defined in the blockchainConfig or options
    let simulatorBlocktime = this.blockchainConfig.simulatorBlocktime || options.simulatorBlocktime;
    if (simulatorBlocktime) {
      cmds.push("-b \"" + (simulatorBlocktime) + "\"");
    }

    // Setting up network id for simulator from blockchainConfig or options.
    // Otherwise ganache-cli would make random network id.
    let networkId = this.blockchainConfig.networkId || options.networkId;
    if (networkId) { // Don't handle networkId=="0" because it is not a valid networkId for ganache-cli.
      cmds.push("--networkId " + networkId);
    }

    this.runCommand(cmds, host, port);
  }

  runCommand(cmds) {
    const ganache_main = require.resolve('ganache-cli', {paths: [embarkPath('node_modules')]});
    const ganache_json = pkgUp.sync(path.dirname(ganache_main));
    const ganache_root = path.dirname(ganache_json);
    const ganache_bin = require(ganache_json).bin;
    let ganache;
    if (typeof ganache_bin === 'string') {
      ganache = path.join(ganache_root, ganache_bin);
    } else {
      ganache = path.join(ganache_root, ganache_bin['ganache-cli']);
    }

    const programName = 'ganache-cli';
    const program = ganache;
    this.logger.info(`running: ${programName} ${cmds.join(' ')}`);

    shelljs.exec(`node ${program} ${cmds.join(' ')}`, {async: true});
  }
}

module.exports = Simulator;
