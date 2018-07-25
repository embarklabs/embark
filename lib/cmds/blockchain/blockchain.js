const async = require('async');
const child_process = require('child_process');

const fs = require('../../core/fs.js');
const constants = require('../../constants.json');
const utils = require('../../utils/utils.js');

const GethCommands = require('./geth_commands.js');

/*eslint complexity: ["error", 36]*/
var Blockchain = function(options) {
  this.blockchainConfig = options.blockchainConfig;
  this.env = options.env || 'development';
  this.client = options.client;
  this.isDev = options.isDev;
  this.onReadyCallback = options.onReadyCallback;
  this.onExitCallback = options.onExitCallback;

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
    rpcApi: (this.blockchainConfig.rpcApi || ['eth', 'web3', 'net', 'debug']),
    wsRPC: (this.blockchainConfig.wsRPC === undefined) || this.blockchainConfig.wsRPC,
    wsHost: this.blockchainConfig.wsHost || 'localhost',
    wsPort: this.blockchainConfig.wsPort || 8546,
    wsOrigins: this.blockchainConfig.wsOrigins || false,
    wsApi: (this.blockchainConfig.wsApi || ['eth', 'web3', 'net', 'shh', 'debug']),
    vmdebug: this.blockchainConfig.vmdebug || false,
    targetGasLimit: this.blockchainConfig.targetGasLimit || false,
    syncMode: this.blockchainConfig.syncMode,
    syncmode: this.blockchainConfig.syncmode,
    verbosity: this.blockchainConfig.verbosity
  };

  this.setupProxy();

  if (this.blockchainConfig === {} || JSON.stringify(this.blockchainConfig) === '{"enabled":true}') {
    this.config.account = {};
    this.config.account.password = fs.embarkPath("templates/boilerplate/config/development/password");
    this.config.genesisBlock = fs.embarkPath("templates/boilerplate/config/development/genesis.json");
    this.config.datadir = fs.embarkPath(".embark/development/datadir");
  }

  const spaceMessage = 'The path for %s in blockchain config contains spaces, please remove them';
  if (this.config.datadir && this.config.datadir.indexOf(' ') > 0) {
    console.error(__(spaceMessage, 'datadir'));
    process.exit();
  }
  if (this.config.account.password && this.config.account.password.indexOf(' ') > 0) {
    console.error(__(spaceMessage, 'account.password'));
    process.exit();
  }
  if (this.config.genesisBlock && this.config.genesisBlock.indexOf(' ') > 0) {
    console.error(__(spaceMessage, 'genesisBlock'));
    process.exit();
  }

  this.client = new options.client({config: this.config, env: this.env, isDev: this.isDev});
};

Blockchain.prototype.setupProxy = function() {
  this.config.proxy = true;
  if (this.blockchainConfig.proxy === false) {
    this.config.proxy = false;
    return;
  }

  const proxy = require('../../core/proxy');
  const Ipc = require('../../core/ipc');

  let ipcObject = new Ipc({ipcRole: 'client'});

  this.rpcProxy = proxy.serve(ipcObject, this.config.rpcHost, this.config.rpcPort, false);
  this.wsProxy = proxy.serve(ipcObject, this.config.wsHost, this.config.wsPort, true);
  this.config.rpcPort += constants.blockchain.servicePortOnProxy;
  this.config.wsPort += constants.blockchain.servicePortOnProxy;
};

Blockchain.prototype.shutdownProxy = function() {
  if (!this.config.proxy) {
    return;
  }

  this.rpcProxy.close();
  this.wsProxy.close();
};

Blockchain.prototype.runCommand = function(cmd, options, callback) {
  console.log(__("running: %s", cmd.underline).green);
  if (this.blockchainConfig.silent) {
    options.silent = true;
  }
  return child_process.exec(cmd, options, callback);
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
      self.client.mainCommand(address, function(cmd, args) {
        next(null, cmd, args);
      }, true);
    }
  ], function (err, cmd, args) {
    if (err) {
      console.error(err);
      return;
    }
    args = utils.compact(args);

    let full_cmd = cmd + " " + args.join(' ');
    console.log(__("running: %s", full_cmd.underline).green);
    self.child = child_process.spawn(cmd, args, {cwd: process.cwd()});

    self.child.on('error', (err) => {
      err = err.toString();
      console.error('Blockchain error: ', err);
      if (self.env === 'development' && err.indexOf('Failed to unlock') > 0) {
        console.error('\n' + __('Development blockchain has changed to use the --dev option.').yellow);
        console.error(__('You can reset your workspace to fix the problem with').yellow + ' embark reset'.cyan);
        console.error(__('Otherwise, you can change your data directory in blockchain.json (datadir)').yellow);
      }
    });
    self.child.stdout.on('data', (data) => {
      console.error(`Geth error: ${data}`);
    });
    // Geth logs appear in stderr somehow
    self.child.stderr.on('data', (data) => {
      data = data.toString();
      if (!self.readyCalled && data.indexOf('WebSocket endpoint opened') > -1) {
        self.readyCalled = true;
        self.readyCallback();
      }
      console.log('Geth: ' + data);
    });
    self.child.on('exit', (code) => {
      let strCode;
      if (code) {
        strCode = ' with error code ' + code;
      } else {
        strCode = ' with no error code (manually killed?)';
      }
      console.error('Geth exited' + strCode);

      if(self.onExitCallback){
        self.onExitCallback();
      }
    });

    self.child.on('uncaughtException', (err) => {
      console.error('Uncaught geth exception', err);

      if(self.onExitCallback){
        self.onExitCallback();
      }
    });
  });
};

Blockchain.prototype.readyCallback = function() {
  if (this.onReadyCallback) {
    this.onReadyCallback();
  }

  if (this.config.mineWhenNeeded && !this.isDev) {
    const GethMiner = require('./miner');
    this.miner = new GethMiner();
  }
};

Blockchain.prototype.kill = function() {
  this.shutdownProxy();

  if (this.child) {
    this.child.kill();
  }
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
  let versionCmd = this.client.determineVersionCommand();
  this.runCommand(versionCmd, {}, (err, stdout, stderr) => {
    if (err || !stdout || stderr.indexOf("not found") >= 0 || stdout.indexOf("not found") >= 0) {
      return callback('Geth not found');
    }
    callback();
  });
};

Blockchain.prototype.initChainAndGetAddress = function(callback) {
  const self = this;
  let address = null;
  const ALREADY_INITIALIZED = 'already';

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
      self.runCommand(self.client.listAccountsCommand(), {}, (err, stdout, _stderr) => {
        if (err || stdout === undefined || stdout.match(/{(\w+)}/) === null || stdout.indexOf("Fatal") >= 0) {
          console.log(__("no accounts found").green);
          return next();
        }
        console.log(__("already initialized").green);
        address = stdout.match(/{(\w+)}/)[1];
        next(ALREADY_INITIALIZED);
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
    if (err === ALREADY_INITIALIZED) {
      err = null;
    }
    callback(err, address);
  });
};

var BlockchainClient = function(blockchainConfig, client, env, onReadyCallback, onExitCallback) {
  const isDev = blockchainConfig.isDev || blockchainConfig.default;
  // TODO add other clients at some point
  if (client === 'geth') {
    return new Blockchain({blockchainConfig, client: GethCommands, env, isDev, onReadyCallback, onExitCallback});
  } else {
    throw new Error('unknown client');
  }
};

module.exports = BlockchainClient;
