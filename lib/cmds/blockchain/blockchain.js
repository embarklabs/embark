var shelljs = require('shelljs');

var fs = require('../../core/fs.js');

var GethCommands = require('./geth_commands.js');

/*eslint complexity: ["error", 35]*/
var Blockchain = function(options) {
  this.blockchainConfig = options.blockchainConfig;
  this.env = options.env || 'development';
  this.client = options.client;

  if ((this.blockchainConfig === {} || JSON.stringify(this.blockchainConfig) === '{"enabled":true}') && this.env !== 'development') {
    console.log("===> warning: running default config on a non-development environment");
  }

  this.config = {
    geth_bin: this.blockchainConfig.geth_bin || 'geth',
    networkType: this.blockchainConfig.networkType || 'custom',
    genesisBlock: this.blockchainConfig.genesisBlock || false,
    datadir: this.blockchainConfig.datadir || false,
    mineWhenNeeded: this.blockchainConfig.mineWhenNeeded || false,
    rpcHost: this.blockchainConfig.rpcHost || 'localhost',
    rpcPort: this.blockchainConfig.rpcPort || 8545,
    rpcCorsDomain: this.blockchainConfig.rpcCorsDomain || false,
    networkId: this.blockchainConfig.networkId || 1337,
    port: this.blockchainConfig.port || 30303,
    nodiscover: this.blockchainConfig.nodiscover || false,
    mine: this.blockchainConfig.mine || false,
    account: this.blockchainConfig.account || {},
    whisper: (this.blockchainConfig.whisper === undefined) || this.blockchainConfig.whisper,
    maxpeers: ((this.blockchainConfig.maxpeers === 0) ? 0 : (this.blockchainConfig.maxpeers || 25)),
    bootnodes: this.blockchainConfig.bootnodes || "",
    rpcApi: (this.blockchainConfig.rpcApi || ['eth', 'web3', 'net']),
    wsRPC: (this.blockchainConfig.wsRPC === undefined) || this.blockchainConfig.wsRPC,
    wsHost: this.blockchainConfig.wsHost || 'localhost',
    wsPort: this.blockchainConfig.wsPort || 8546,
    wsOrigins: this.blockchainConfig.wsOrigins || false,
    wsApi: (this.blockchainConfig.wsApi || ['eth', 'web3', 'net', 'shh']),
    vmdebug: this.blockchainConfig.vmdebug || false,
    targetGasLimit: this.blockchainConfig.targetGasLimit || false,
    light: this.blockchainConfig.light || false,
    fast: this.blockchainConfig.fast || false
  };

  if (this.blockchainConfig === {} || JSON.stringify(this.blockchainConfig) === '{"enabled":true}') {
    this.config.account = {};
    this.config.account.password = fs.embarkPath("templates/boilerplate/config/development/password");
    this.config.genesisBlock = fs.embarkPath("templates/boilerplate/config/development/genesis.json");
    this.config.datadir = fs.embarkPath(".embark/development/datadir");
  }

  if (this.blockchainConfig.isDev) {
    this.isDev = true;
  } else if (this.blockchainConfig.isDev === false) {
    this.isDev = false;
  } else {
    this.isDev = this.env === 'development';
  }

  this.client = new options.client({config: this.config, env: this.env, isDev: this.isDev});
};

Blockchain.prototype.runCommand = function(cmd, options) {
  console.log(("running: " + cmd.underline).green);
  return shelljs.exec(cmd, options, (err, stdout, _stderr) => {
    if (err && this.env === 'development' && stdout.indexOf('Failed to unlock developer account') > 0) {
      console.warn('\nDevelopment blockchain has changed to use the --dev option.'.yellow);
      console.warn('You can reset your workspace to fix the problem with'.yellow + ' embark reset'.cyan);
      console.warn('Otherwise, you can change your data directory in blockchain.json (datadir)'.yellow);
    }
  });
};

Blockchain.prototype.run = function() {
  var self = this;
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  console.log(("Embark Blockchain Using: " + this.client.name.underline).magenta);
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  if (!this.isClientInstalled()) {
    console.log(("could not find " + this.config.geth_bin + " command; is " + this.client.name + " installed or in the PATH?").green);
    return;
  }
  let address = '';
  if (!this.isDev) {
    address = this.initChainAndGetAddress();
  }
  this.client.mainCommand(address, function(cmd) {
    self.runCommand(cmd, {async: true});
  });
};

Blockchain.prototype.isClientInstalled = function() {
  let versionCmd = this.client.determineVersion();
  let result = this.runCommand(versionCmd);

  if (result.output === undefined || result.output.indexOf("not found") >= 0) {
    return false;
  }
  return true;
};

Blockchain.prototype.initChainAndGetAddress = function() {
  var address = null, result;

  // ensure datadir exists, bypassing the interactive liabilities prompt.
  this.datadir = '.embark/' + this.env + '/datadir';
  fs.mkdirpSync(this.datadir);

  // copy mining script
  fs.copySync(fs.embarkPath("js"), ".embark/" + this.env + "/js", {overwrite: true});

  // check if an account already exists, create one if not, return address
  result = this.runCommand(this.client.listAccountsCommand());
  if (result.output === undefined || result.output.match(/{(\w+)}/) === null || result.output.indexOf("Fatal") >= 0) {
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
};

var BlockchainClient = function(blockchainConfig, client, env) {
  if (client === 'geth') {
    return new Blockchain({blockchainConfig: blockchainConfig, client: GethCommands, env: env});
  } else {
    throw new Error('unknown client');
  }
};

module.exports = BlockchainClient;
