const async = require('async');
const {spawn, exec} = require('child_process');

const fs = require('../../core/fs.js');
const constants = require('../../constants.json');
const utils = require('../../utils/utils.js');

const GethClient = require('./gethClient.js');
const ParityClient = require('./parityClient.js');
const DevFunds = require('./dev_funds.js');

const proxy = require('./proxy');
const Ipc = require('../../core/ipc');

const {defaultHost, dockerHostSwap} = require('../../utils/host');

const {defaultHost, dockerHostSwap} = require('../../utils/host');

/*eslint complexity: ["error", 36]*/
var Blockchain = function(userConfig, clientClass) {
  this.userConfig = userConfig;
  this.env = userConfig.env || 'development';
  this.isDev = userConfig.isDev;
  this.onReadyCallback = userConfig.onReadyCallback || (() => {});
  this.onExitCallback = userConfig.onExitCallback;
  this.proxyIpc = null;

  let defaultWsApi = clientClass.DEFAULTS.WS_API;
  if (this.isDev) defaultWsApi = clientClass.DEFAULTS.DEV_WS_API;

  this.config = {
    silent: this.userConfig.silent,
    ethereumClientName: this.userConfig.ethereumClientName,
    ethereumClientBin: this.userConfig.ethereumClientBin || this.userConfig.ethereumClientName || 'geth',
    networkType: this.userConfig.networkType || clientClass.DEFAULTS.NETWORK_TYPE,
    networkId: this.userConfig.networkId || clientClass.DEFAULTS.NETWORK_ID,
    genesisBlock: this.userConfig.genesisBlock || false,
    datadir: this.userConfig.datadir || false,
    mineWhenNeeded: this.userConfig.mineWhenNeeded || false,
    rpcHost: dockerHostSwap(this.userConfig.rpcHost) || defaultHost,
    rpcPort: this.userConfig.rpcPort || 8545,
    rpcCorsDomain: this.userConfig.rpcCorsDomain || false,
    rpcApi: this.userConfig.rpcApi || clientClass.DEFAULTS.RPC_API,
    port: this.userConfig.port || 30303,
    nodiscover: this.userConfig.nodiscover || false,
    mine: this.userConfig.mine || false,
    account: this.userConfig.account || {},
    devPassword: this.userConfig.devPassword || "",
    whisper: (this.userConfig.whisper != false),
    maxpeers: ((this.userConfig.maxpeers === 0) ? 0 : (this.userConfig.maxpeers || 25)),
    bootnodes: this.userConfig.bootnodes || "",
    wsRPC: (this.userConfig.wsRPC != false),
    wsHost: dockerHostSwap(this.userConfig.wsHost) || defaultHost,
    wsPort: this.userConfig.wsPort || 8546,
    wsOrigins: this.userConfig.wsOrigins || false,
    wsApi: this.userConfig.wsApi || defaultWsApi,
    vmdebug: this.userConfig.vmdebug || false,
    targetGasLimit: this.userConfig.targetGasLimit || false,
    syncMode: this.userConfig.syncMode || this.userConfig.syncmode,
    verbosity: this.userConfig.verbosity,
    proxy: this.userConfig.proxy || true
  };

  if (this.userConfig === {} || this.userConfig.default || JSON.stringify(this.userConfig) === '{"enabled":true}') {
    this.config.account = {};
    if (this.env === 'development') {
      this.isDev = true;
    } else {
      this.config.account.password = fs.embarkPath("templates/boilerplate/config/privatenet/password");
      this.config.genesisBlock = fs.embarkPath("templates/boilerplate/config/privatenet/genesis.json");
    }
    this.config.datadir = fs.dappPath(".embark/development/datadir");
    this.config.wsOrigins = "http://localhost:8000";
    this.config.rpcCorsDomain = "http://localhost:8000";
    this.config.targetGasLimit = 8000000;
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
  this.initProxy();
  this.client = new clientClass({config: this.config, env: this.env, isDev: this.isDev});
};

Blockchain.prototype.initProxy = function() {
  if (this.config.proxy) {
    this.config.rpcPort += constants.blockchain.servicePortOnProxy;
    this.config.wsPort += constants.blockchain.servicePortOnProxy;
  }
};

Blockchain.prototype.setupProxy = async function() {
  if (!this.proxyIpc) this.proxyIpc = new Ipc({ipcRole: 'client'});

  let wsProxy;
  if (this.config.wsRPC) {
    wsProxy = proxy.serve(this.proxyIpc, this.config.wsHost, this.config.wsPort, true, this.config.wsOrigins);
  }

  [this.rpcProxy, this.wsProxy] = await Promise.all([proxy.serve(this.proxyIpc, this.config.rpcHost, this.config.rpcPort, false), wsProxy]);
};

Blockchain.prototype.shutdownProxy = function() {
  if (!this.config.proxy) {
    return;
  }

  if (this.rpcProxy) this.rpcProxy.close();
  if (this.wsProxy) this.wsProxy.close();
};

Blockchain.prototype.runCommand = function(cmd, options, callback) {
  console.log(__("running: %s", cmd.underline).green);
  if (this.config.silent) {
    options.silent = true;
  }
  return exec(cmd, options, callback);
};

Blockchain.prototype.run = function() {
  var self = this;
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  console.log(__("Embark Blockchain using %s", self.client.prettyName.underline).magenta);
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);

  if (self.client.name === 'geth') this.checkPathLength();

  let address = '';
  async.waterfall([
    function checkInstallation(next) {
      self.isClientInstalled((err) => {
        if (err) {
          return next({message: err});
        }
        next();
      });
    },
    function init(next) {
      if (self.isDev) {
        return self.initDevChain((err) => {
          next(err);
        });
      }
      return self.initChainAndGetAddress((err, addr) => {
        address = addr;
        next(err);
      });
    },
    function getMainCommand(next) {
      self.client.mainCommand(address, function(cmd, args) {
        next(null, cmd, args);
      }, true);
    }
  ], function(err, cmd, args) {
    if (err) {
      console.error(err.message);
      return;
    }
    args = utils.compact(args);

    let full_cmd = cmd + " " + args.join(' ');
    console.log(__("running: %s", full_cmd.underline).green);
    self.child = spawn(cmd, args, {cwd: process.cwd()});

    self.child.on('error', (err) => {
      err = err.toString();
      console.error('Blockchain error: ', err);
      if (self.env === 'development' && err.indexOf('Failed to unlock') > 0) {
        console.error('\n' + __('Development blockchain has changed to use the --dev option.').yellow);
        console.error(__('You can reset your workspace to fix the problem with').yellow + ' embark reset'.cyan);
        console.error(__('Otherwise, you can change your data directory in blockchain.json (datadir)').yellow);
      }
    });

    // TOCHECK I don't understand why stderr and stdout are reverted.
    // This happens with Geth and Parity, so it does not seems a client problem
    self.child.stdout.on('data', (data) => {
      console.error(`${self.client.name} error: ${data}`);
    });

    self.child.stderr.on('data', async (data) => {
      data = data.toString();
      if (!self.readyCalled && self.client.isReady(data)) {
        self.readyCalled = true;
        if (self.isDev) {
          self.fundAccounts((err) => {
            if (err) console.error('Error funding accounts', err);
          });
        }
        if (self.config.proxy) {
          await self.setupProxy();
        }
        self.readyCallback();
      }
      console.log(`${self.client.name}: ${data}`);
    });

    self.child.on('exit', (code) => {
      let strCode;
      if (code) {
        strCode = 'with error code ' + code;
      } else {
        strCode = 'with no error code (manually killed?)';
      }
      console.error(self.client.name + ' exited ' + strCode);
      if (self.onExitCallback) {
        self.onExitCallback();
      }
    });

    self.child.on('uncaughtException', (err) => {
      console.error('Uncaught ' + self.client.name + ' exception', err);
      if (self.onExitCallback) {
        self.onExitCallback();
      }
    });
  });
};

Blockchain.prototype.fundAccounts = function(cb) {
  DevFunds.new({blockchainConfig: this.config}).then(devFunds => {
    devFunds.fundAccounts(this.client.needKeepAlive(), (err) => {
      cb(err);
    });
  });
};

Blockchain.prototype.readyCallback = function() {
  if (this.onReadyCallback) {
    this.onReadyCallback();
  }
  if (this.config.mineWhenNeeded && !this.isDev) {
    this.miner = this.client.getMiner();
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
    console.error("===========> ".yellow + __('WARNING! ÐApp path length is too long: ').yellow + dappPath.yellow);
    console.error("===========> ".yellow + __('This is known to cause issues with starting geth, please consider reducing your ÐApp path\'s length to 66 characters or less.').yellow);
    console.error("===============================================================================".yellow);
  }
};

Blockchain.prototype.isClientInstalled = function(callback) {
  let versionCmd = this.client.determineVersionCommand();
  this.runCommand(versionCmd, {}, (err, stdout, stderr) => {
    if (err || !stdout || stderr.indexOf("not found") >= 0 || stdout.indexOf("not found") >= 0) {
      return callback(__('Ethereum client bin not found:') + ' ' + this.client.getBinaryPath());
    }
    callback();
  });
};

Blockchain.prototype.initDevChain = function(callback) {
  const self = this;
  const ACCOUNTS_ALREADY_PRESENT = 'accounts_already_present';
  // Init the dev chain
  self.client.initDevChain('.embark/development/datadir', (err) => {
    if (err) {
      console.log(err);
      return callback(err);
    }

    let needToCreateOtherAccounts = self.config.account && self.config.account.numAccounts;
    if (!needToCreateOtherAccounts) return callback();

    // Create other accounts
    async.waterfall([
      function listAccounts(next) {
        self.runCommand(self.client.listAccountsCommand(), {}, (err, stdout, _stderr) => {
          if (err || stdout === undefined || stdout.indexOf("Fatal") >= 0) {
            console.log(__("no accounts found").green);
            return next();
          }
          // List current addresses
          self.config.unlockAddressList = self.client.parseListAccountsCommandResultToAddressList(stdout);
          // Count current addresses and remove the default account from the count (because password can be different)
          let addressCount = self.client.parseListAccountsCommandResultToAddressCount(stdout);
          let utilityAddressCount = self.client.parseListAccountsCommandResultToAddressCount(stdout) - 1;
          utilityAddressCount = (utilityAddressCount > 0 ? utilityAddressCount : 0);
          let accountsToCreate = self.config.account.numAccounts - utilityAddressCount;
          if (accountsToCreate > 0) {
            next(null, accountsToCreate, addressCount === 0);
          } else {
            next(ACCOUNTS_ALREADY_PRESENT);
          }
        });
      },
      function newAccounts(accountsToCreate, firstAccount, next) {
        // At first launch, Geth --dev does not create its own dev account if any other account are present. Parity --dev always does. Make this choerent between the two
        if (firstAccount && self.client.name === 'geth') accountsToCreate++;
        var accountNumber = 0;
        async.whilst(
          function() {
            return accountNumber < accountsToCreate;
          },
          function(callback) {
            accountNumber++;
            self.runCommand(self.client.newAccountCommand(firstAccount), {}, (err, stdout, _stderr) => {
              if (err) {
                return callback(err, accountNumber);
              }
              self.config.unlockAddressList.push(self.client.parseNewAccountCommandResultToAddress(stdout));
              firstAccount = false;
              callback(null, accountNumber);
            });
          },
          function(err) {
            next(err);
          }
        );
      }
    ], (err) => {
      if (err && err !== ACCOUNTS_ALREADY_PRESENT) {
        console.log(err);
        return callback(err);
      }
      callback();
    });
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
    function listAccounts(next) {
      self.runCommand(self.client.listAccountsCommand(), {}, (err, stdout, _stderr) => {
        if (err || stdout === undefined || stdout.indexOf("Fatal") >= 0) {
          console.log(__("no accounts found").green);
          return next();
        }
        let firstAccountFound = self.client.parseListAccountsCommandResultToAddress(stdout);
        if (firstAccountFound === undefined || firstAccountFound === "") {
          console.log(__("no accounts found").green);
          return next();
        }
        console.log(__("already initialized").green);
        address = firstAccountFound;
        next(ALREADY_INITIALIZED);
      });
    },
    function genesisBlock(next) {
      //There's no genesis init with Parity. Custom network are set in the chain property at startup
      if (!self.config.genesisBlock || self.client.name === 'parity') {
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
        address = self.client.parseNewAccountCommandResultToAddress(stdout);
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

var BlockchainClient = function(userConfig, clientName, env, onReadyCallback, onExitCallback) {
  if ((userConfig === {} || JSON.stringify(userConfig) === '{"enabled":true}') && env !== 'development') {
    console.log("===> " + __("warning: running default config on a non-development environment"));
  }
  // if client is not set in preferences, default is geth
  if (!userConfig.ethereumClientName) userConfig.ethereumClientName = 'geth';
  // if clientName is set, it overrides preferences
  if (clientName) userConfig.ethereumClientName = clientName;
  // Choose correct client instance based on clientName
  let clientClass;
  switch (userConfig.ethereumClientName) {
    case 'geth':
      clientClass = GethClient;
      break;

    case 'parity':
      clientClass = ParityClient;
      break;

    default:
      console.error(__('Unknow client "%s". Please use one of the following: %s', userConfig.ethereumClientName, 'geth, parity'));
      process.exit();
  }
  userConfig.isDev = (userConfig.isDev || userConfig.default);
  userConfig.env = env;
  userConfig.onReadyCallback = onReadyCallback;
  userConfig.onExitCallback = onExitCallback;
  return new Blockchain(userConfig, clientClass);
};

module.exports = BlockchainClient;
