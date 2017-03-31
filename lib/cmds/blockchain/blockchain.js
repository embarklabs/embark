let colors = require('colors');
let shelljs = require('shelljs');

let fs = require('../../core/fs.js');

let GethCommands = require('./geth_commands.js');

let BlockchainClient = function(blockchainConfig, client, env) {
  if (client === 'geth') {
    return new Blockchain({blockchainConfig: blockchainConfig, client: new GethCommands(), env: env});
  } else {
    throw new Error('unknown client');
  }
};

/*eslint complexity: ["error", 22]*/
class Blockchain {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.env = options.env || 'development';
    this.client = options.client;

    this.config = {
      geth_bin: this.blockchainConfig.geth_bin || 'geth',
      networkType: this.blockchainConfig.networkType || 'custom',
      genesisBlock: this.blockchainConfig.genesisBlock || false,
      datadir: this.blockchainConfig.datadir || false,
      mineWhenNeeded: this.blockchainConfig.mineWhenNeeded || false,
      rpcHost: this.blockchainConfig.rpcHost || 'localhost',
      rpcPort: this.blockchainConfig.rpcPort || 8545,
      rpcCorsDomain: this.blockchainConfig.rpcCorsDomain || false,
      networkId: this.blockchainConfig.networkId || 12301,
      port: this.blockchainConfig.port || 30303,
      nodiscover: this.blockchainConfig.nodiscover || false,
      mine: this.blockchainConfig.mine || false,
      account: this.blockchainConfig.account || {},
      whisper: (this.blockchainConfig.whisper === undefined) || this.blockchainConfig.whisper,
      maxpeers: ((this.blockchainConfig.maxpeers === 0) ? 0 : (this.blockchainConfig.maxpeers || 25)),
      bootnodes: this.blockchainConfig.bootnodes || "",
      rpcApi: (this.blockchainConfig.rpcApi || ['eth', 'web3', 'net']),
      vmdebug: this.blockchainConfig.vmdebug || false
    };
  }

  runCommand(cmd) {
    console.log(("running: " + cmd.underline).green);
    return shelljs.exec(cmd);
  }

  run () {
    let self = this;
    console.log("===============================================================================".magenta);
    console.log("===============================================================================".magenta);
    console.log(("Embark Blockchain Using: " + this.client.name.underline).magenta);
    console.log("===============================================================================".magenta);
    console.log("===============================================================================".magenta);
    let address = this.initChainAndGetAddress();
    this.client.mainCommand(address, function(cmd) {
      shelljs.exec(cmd, {async : true});
    });
  }

  initChainAndGetAddress() {
    let address = null, result;

    // ensure datadir exists, bypassing the interactive liabilities prompt.
    this.datadir = '.embark/' + this.env + '/datadir';
    fs.mkdirpSync(this.datadir);

    // copy mining script
    fs.copySync(fs.embarkPath("js"), ".embark/" + this.env + "/js", {overwrite: true});

    // check if an account already exists, create one if not, return address
    result = this.runCommand(this.client.listAccountsCommand());
    if (result.output === undefined || result.output === '' || result.output.indexOf("Fatal") >= 0) {
      console.log("no accounts found".green);
      if (this.config.genesisBlock) {
        console.log("initializing genesis block".green);
        result = this.runCommand(this.client.initGenesisCommmand());
      }

      result = this.runCommand(this.client.newAccountCommand());
      address = result.output.match(/{(\w+)}/)[1];
    } else {
      console.log("already initialized".green);
      address = result.output.match(/{(\w+)}/)[1];
    }

    return address;
  }
}

module.exports = BlockchainClient;

