const async = require('async');
const shelljs = require('shelljs');

const fs = require('../../core/fs.js');

const GethCommands = require('./geth_commands.js');

/*eslint complexity: ["error", 35]*/
var Blockchain = function(options) {
  this.blockchainConfig = options.blockchainConfig;
  this.env = options.env || 'development';
  this.client = options.client;
  this.isDev = options.isDev;
  this.onReadyCallback = options.onReadyCallback;

  if ((this.blockchainConfig === {} || JSON.stringify(this.blockchainConfig) === '{"enabled":true}') && this.env !== 'development') {
    console.log("===> " + __("warning: running default config on a non-development environment"));
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
    fast: this.blockchainConfig.fast || false,
    verbosity: this.blockchainConfig.verbosity
  };

  if (this.blockchainConfig === {} || JSON.stringify(this.blockchainConfig) === '{"enabled":true}') {
    this.config.account = {};
    this.config.account.password = fs.embarkPath("templates/boilerplate/config/development/password");
    this.config.genesisBlock = fs.embarkPath("templates/boilerplate/config/development/genesis.json");
    this.config.datadir = fs.embarkPath(".embark/development/datadir");
  }

  this.client = new options.client({config: this.config, env: this.env, isDev: this.isDev});
};

Blockchain.prototype.runCommand = function(cmd, options, callback) {
  console.log(__("running: %s", cmd.underline).green);
  if (this.blockchainConfig.silent) {
    options.silent = true;
  }
  return shelljs.exec(cmd, options, callback);
};

Blockchain.prototype.run = function() {
  var self = this;
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  console.log(__("Embark Blockchain Using: %s", this.client.name.underline).magenta);
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);

  this.checkPathLength();
  let address = '';
  async.waterfall([
    function checkInstallation(next) {
      self.isClientInstalled((err) => {
        if (err) {
          console.log(__("could not find {{geth_bin}} command; is {{client_name}} installed or in the PATH?", {geth_bin: this.config.geth_bin, client_name: this.client.name}).green);
          return next(err);
        }
        next();
      });
    },
    function init(next) {
      if (!self.isDev) {
        return self.initChainAndGetAddress((err, addr) => {
          address = addr;
          next(err);
        });
      }
      next();
    },
    function getMainCommand(next) {
      self.client.mainCommand(address, function(cmd) {
        next(null, cmd);
      });
    }
  ], function (err, cmd) {
    if (err) {
      console.error(err);
      return;
    }
    const child = self.runCommand(cmd, {}, (err, stdout, _stderr) => {
      if (err && self.env === 'development' && stdout.indexOf('Failed to unlock') > 0) {
        // console.error is captured and sent to the console output regardless of silent setting
        console.error('\n' + __('Development blockchain has changed to use the --dev option.').yellow);
        console.error(__('You can reset your workspace to fix the problem with').yellow + ' embark reset'.cyan);
        console.error(__('Otherwise, you can change your data directory in blockchain.json (datadir)').yellow);
      }
    });
    if (self.onReadyCallback) {
      // Geth logs appear in stderr somehow
      let lastMessage;
      child.stderr.on('data', (data) => {
        if (!self.readyCalled && data.indexOf('Mapped network port') > -1) {
          self.readyCalled = true;
          self.onReadyCallback();
        }
        lastMessage = data;
        console.log('Geth: ' + data);
      });
      child.on('exit', (code) => {
        if (code) {
          console.error('Geth exited with error code ' + code);
          console.error(lastMessage);
        }
      });
    }
  });
};

Blockchain.prototype.checkPathLength = function() {
  let dappPath = fs.dappPath('');
  if (dappPath.length > 66) {
    // console.error is captured and sent to the console output regardless of silent setting
    console.error("===============================================================================".yellow);
    console.error("===========> ".yellow + __('WARNING! DApp path length is too long: ').yellow + dappPath.yellow);
    console.error("===========> ".yellow + __('This is known to cause issues with starting geth, please consider reducing your DApp path\'s length to 66 characters or less.').yellow);
    console.error("===============================================================================".yellow);
  }
};

Blockchain.prototype.isClientInstalled = function(callback) {
  let versionCmd = this.client.determineVersion();
  this.runCommand(versionCmd, {}, (err, stdout, stderr) => {
    if (err || stderr || !stdout || stdout.indexOf("not found") >= 0) {
      return callback('Geth not found');
    }
    callback();
  });
};

Blockchain.prototype.initChainAndGetAddress = function(callback) {
  const self = this;
  let address = null;

  // ensure datadir exists, bypassing the interactive liabilities prompt.
  self.datadir = '.embark/' + self.env + '/datadir';

  async.waterfall([
    function makeDir(next) {
      fs.mkdirp(self.datadir, (err, _result) => {
        next(err);
      });
    },
    function copy(next) {
      // copy mining script
      fs.copy(fs.embarkPath("js"), ".embark/" + self.env + "/js", {overwrite: true}, next);
    },
    function listAccounts(next) {
      self.runCommand(self.client.listAccountsCommand(), {}, (err, stdout, stderr) => {
        if (err || stderr || stdout === undefined || stdout.match(/{(\w+)}/) === null || stdout.indexOf("Fatal") >= 0) {
          console.log(__("no accounts found").green);
          return next();
        }
        console.log(__("already initialized").green);
        address = stdout.match(/{(\w+)}/)[1];
        next();
      });
    },
    function genesisBlock(next) {
      if (!self.config.genesisBlock) {
        return next();
      }
      console.log(__("initializing genesis block").green);
      self.runCommand(self.client.initGenesisCommmand(), {}, (err, _stdout, _stderr) => {
        next(err);
      });
    },
    function newAccount(next) {
      self.runCommand(self.client.newAccountCommand(), {}, (err, stdout, _stderr) => {
        if (err) {
          return next(err);
        }
        address = stdout.match(/{(\w+)}/)[1];
        next();
      });
    }
  ], (err) => {
    callback(err, address);
  });
};

var BlockchainClient = function(blockchainConfig, client, env, isDev, onReadyCallback) {
  // TODO add other clients at some point
  if (client === 'geth') {
    return new Blockchain({blockchainConfig, client: GethCommands, env, isDev, onReadyCallback});
  } else {
    throw new Error('unknown client');
  }
};

module.exports = BlockchainClient;
