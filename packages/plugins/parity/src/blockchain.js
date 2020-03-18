import {__} from 'embark-i18n';
const fs = require('fs-extra');
const async = require('async');
const {spawn, exec} = require('child_process');
const path = require('path');
const constants = require('embark-core/constants');
const ParityClient = require('./parityClient.js');
// const ParityClient = require('./parityClient.js');
// import { Proxy } from './proxy';
import {IPC} from 'embark-core';

import {compact, dappPath, defaultHost, dockerHostSwap, embarkPath/*, AccountParser*/} from 'embark-utils';
import { Logger } from 'embark-logger';

// time between IPC connection attempts (in ms)
const IPC_CONNECT_INTERVAL = 2000;

class Blockchain {
  /*eslint complexity: ["error", 50]*/
  constructor(userConfig, clientClass) {
    this.userConfig = userConfig;
    this.env = userConfig.env || 'development';
    this.isDev = userConfig.isDev;
    this.onReadyCallback = userConfig.onReadyCallback || (() => {});
    this.onExitCallback = userConfig.onExitCallback;
    this.logger = userConfig.logger || new Logger({logLevel: 'debug', context: constants.contexts.blockchain}); // do not pass in events as we don't want any log events emitted
    this.events = userConfig.events;
    this.proxyIpc = null;
    this.isStandalone = userConfig.isStandalone;
    this.certOptions = userConfig.certOptions;


    let defaultWsApi = clientClass.DEFAULTS.WS_API;
    if (this.isDev) defaultWsApi = clientClass.DEFAULTS.DEV_WS_API;

    this.config = {
      silent: this.userConfig.silent,
      client: this.userConfig.client,
      ethereumClientBin: this.userConfig.ethereumClientBin,
      networkType: this.userConfig.networkType || clientClass.DEFAULTS.NETWORK_TYPE,
      networkId: this.userConfig.networkId || clientClass.DEFAULTS.NETWORK_ID,
      genesisBlock: this.userConfig.genesisBlock || false,
      datadir: this.userConfig.datadir,
      mineWhenNeeded: this.userConfig.mineWhenNeeded || false,
      rpcHost: dockerHostSwap(this.userConfig.rpcHost) || defaultHost,
      rpcPort: this.userConfig.rpcPort || 8545,
      rpcCorsDomain: this.userConfig.rpcCorsDomain || false,
      rpcApi: this.userConfig.rpcApi || clientClass.DEFAULTS.RPC_API,
      port: this.userConfig.port || 30303,
      nodiscover: this.userConfig.nodiscover || false,
      mine: this.userConfig.mine || false,
      account: {},
      whisper: (this.userConfig.whisper !== false),
      maxpeers: ((this.userConfig.maxpeers === 0) ? 0 : (this.userConfig.maxpeers || 25)),
      bootnodes: this.userConfig.bootnodes || "",
      wsRPC: (this.userConfig.wsRPC !== false),
      wsHost: dockerHostSwap(this.userConfig.wsHost) || defaultHost,
      wsPort: this.userConfig.wsPort || 8546,
      wsOrigins: this.userConfig.wsOrigins || false,
      wsApi: this.userConfig.wsApi || defaultWsApi,
      vmdebug: this.userConfig.vmdebug || false,
      targetGasLimit: this.userConfig.targetGasLimit || false,
      syncMode: this.userConfig.syncMode || this.userConfig.syncmode,
      verbosity: this.userConfig.verbosity,
      proxy: this.userConfig.proxy,
      customOptions: this.userConfig.customOptions
    };

    this.devFunds = null;

    if (this.userConfig.accounts) {
      const nodeAccounts = this.userConfig.accounts.find(account => account.nodeAccounts);
      if (nodeAccounts) {
        this.config.account = {
          numAccounts: nodeAccounts.numAddresses || 1,
          password: nodeAccounts.password,
          balance: nodeAccounts.balance
        };
      }
    }

    if (this.userConfig === {} || this.userConfig.default || JSON.stringify(this.userConfig) === '{"client":"parity"}') {
      if (this.env === 'development') {
        this.isDev = true;
      } else {
        this.config.genesisBlock = embarkPath("templates/boilerplate/config/privatenet/genesis.json");
      }
      this.config.datadir = dappPath(".embark/development/datadir");
      this.config.wsOrigins = this.config.wsOrigins || "http://localhost:8000";
      this.config.rpcCorsDomain = this.config.rpcCorsDomain || "http://localhost:8000";
      this.config.targetGasLimit = 8000000;
    }
    this.config.account.devPassword = path.join(this.config.datadir, "devPassword");

    const spaceMessage = 'The path for %s in blockchain config contains spaces, please remove them';
    if (this.config.datadir && this.config.datadir.indexOf(' ') > 0) {
      this.logger.error(__(spaceMessage, 'datadir'));
      process.exit(1);
    }
    if (this.config.account.password && this.config.account.password.indexOf(' ') > 0) {
      this.logger.error(__(spaceMessage, 'accounts.password'));
      process.exit(1);
    }
    if (this.config.genesisBlock && this.config.genesisBlock.indexOf(' ') > 0) {
      this.logger.error(__(spaceMessage, 'genesisBlock'));
      process.exit(1);
    }
    this.client = new clientClass({config: this.config, env: this.env, isDev: this.isDev});

    this.initStandaloneProcess();
  }

  /**
   * Polls for a connection to an IPC server (generally this is set up
   * in the Embark process). Once connected, any logs logged to the
   * Logger will be shipped off to the IPC server. In the case of `embark
   * run`, the BlockchainListener module is listening for these logs.
   *
   * @returns {void}
   */
  initStandaloneProcess() {
    if (this.isStandalone) {
      let logQueue = [];

      // on every log logged in logger (say that 3x fast), send the log
      // to the IPC serve listening (only if we're connected of course)
      this.logger.events.on('log', (logLevel, message) => {
        if (this.ipc.connected) {
          this.ipc.request('blockchain:log', {logLevel, message});
        } else {
          logQueue.push({logLevel, message});
        }
      });

      this.ipc = new IPC({ipcRole: 'client'});

      // Wait for an IPC server to start (ie `embark run`) by polling `.connect()`.
      // Do not kill this interval as the IPC server may restart (ie restart
      // `embark run` without restarting `embark blockchain`)
      setInterval(() => {
        if (!this.ipc.connected) {
          this.ipc.connect(() => {
            if (this.ipc.connected) {
              logQueue.forEach(message => { this.ipc.request('blockchain:log', message); });
              logQueue = [];
              this.ipc.client.on('process:blockchain:stop', () => {
                this.kill();
                process.exit(0);
              });
            }
          });
        }
      }, IPC_CONNECT_INTERVAL);
    }
  }

  async setupProxy() {
    // if (!this.proxyIpc) this.proxyIpc = new IPC({ipcRole: 'client'});

    // const addresses = AccountParser.parseAccountsConfig(this.userConfig.accounts, false, dappPath(), this.logger);

    // let wsProxy;
    // if (this.config.wsRPC) {
    //   wsProxy = new Proxy(this.proxyIpc).serve(this.config.wsHost, this.config.wsPort, true, this.config.wsOrigins, addresses, this.certOptions);
    // }

    // [this.rpcProxy, this.wsProxy] = await Promise.all([new Proxy(this.proxyIpc).serve(this.config.rpcHost, this.config.rpcPort, false, null, addresses, this.certOptions), wsProxy]);
  }

  shutdownProxy() {
    // if (!this.config.proxy) {
    //   return;
    // }

    // if (this.rpcProxy) this.rpcProxy.close();
    // if (this.wsProxy) this.wsProxy.close();
  }

  runCommand(cmd, options, callback) {
    this.logger.info(__("running: %s", cmd.underline).green);
    if (this.config.silent) {
      options.silent = true;
    }
    return exec(cmd, options, callback);
  }

  run() {
    var self = this;
    this.logger.info("===============================================================================".magenta);
    this.logger.info("===============================================================================".magenta);
    this.logger.info(__("Embark Blockchain using %s", self.client.prettyName.underline).magenta);
    this.logger.info("===============================================================================".magenta);
    this.logger.info("===============================================================================".magenta);

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
        self.client.mainCommand(address, function (cmd, args) {
          next(null, cmd, args);
        }, true);
      }
    ], function (err, cmd, args) {
      if (err) {
        self.logger.error(err.message);
        return;
      }
      args = compact(args);

      let full_cmd = cmd + " " + args.join(' ');
      self.logger.info(__("running: %s", full_cmd.underline).green);
      self.child = spawn(cmd, args, {cwd: process.cwd()});

      self.child.on('error', (err) => {
        err = err.toString();
        self.logger.error('Blockchain error: ', err);
        if (self.env === 'development' && err.indexOf('Failed to unlock') > 0) {
          self.logger.error('\n' + __('Development blockchain has changed to use the --dev option.').yellow);
          self.logger.error(__('You can reset your workspace to fix the problem with').yellow + ' embark reset'.cyan);
          self.logger.error(__('Otherwise, you can change your data directory in blockchain.json (datadir)').yellow);
        }
      });

      // TOCHECK I don't understand why stderr and stdout are reverted.
      // This happens with Geth and Parity, so it does not seems a client problem
      self.child.stdout.on('data', (data) => {
        self.logger.info(`${self.client.name} error: ${data}`);
      });

      self.child.stderr.on('data', async (data) => {
        data = data.toString();
        if (!self.readyCalled && self.client.isReady(data)) {
          self.readyCalled = true;
          // if (self.config.proxy) {
          // await self.setupProxy();
          // }
          self.readyCallback();
        }
        self.logger.info(`${self.client.name}: ${data}`);
      });

      self.child.on('exit', (code) => {
        let strCode;
        if (code) {
          strCode = 'with error code ' + code;
        } else {
          strCode = 'with no error code (manually killed?)';
        }
        self.logger.error(self.client.name + ' exited ' + strCode);
        if (self.onExitCallback) {
          self.onExitCallback();
        }
      });

      self.child.on('uncaughtException', (err) => {
        self.logger.error('Uncaught ' + self.client.name + ' exception', err);
        if (self.onExitCallback) {
          self.onExitCallback();
        }
      });
    });
  }

  readyCallback() {
    if (this.onReadyCallback) {
      this.onReadyCallback();
    }
    if (this.config.mineWhenNeeded && !this.isDev) {
      this.miner = this.client.getMiner();
    }
  }

  kill() {
    this.shutdownProxy();
    if (this.child) {
      this.child.kill();
    }
  }

  isClientInstalled(callback) {
    let versionCmd = this.client.determineVersionCommand();
    this.runCommand(versionCmd, {}, (err, stdout, stderr) => {
      if (err || !stdout || stderr.indexOf("not found") >= 0 || stdout.indexOf("not found") >= 0) {
        return callback(__('Ethereum client bin not found:') + ' ' + this.client.getBinaryPath());
      }
      const parsedVersion = this.client.parseVersion(stdout);
      const supported = this.client.isSupportedVersion(parsedVersion);
      if (supported === undefined) {
        this.logger.warn((__('WARNING! Ethereum client version could not be determined or compared with version range') + ' ' + this.client.versSupported + __(', for best results please use a supported version')));
      } else if (!supported) {
        this.logger.warn((__('WARNING! Ethereum client version unsupported, for best results please use a version in range') + ' ' + this.client.versSupported));
      }
      callback();
    });
  }

  initDevChain(callback) {
    const self = this;
    const ACCOUNTS_ALREADY_PRESENT = 'accounts_already_present';
    // Init the dev chain
    self.client.initDevChain(self.config.datadir, (err) => {
      if (err) {
        return callback(err);
      }

      const accountsToCreate = self.config.account && self.config.account.numAccounts;
      if (!accountsToCreate) return callback();

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
            let addressCount = self.config.unlockAddressList.length;
            if (addressCount < accountsToCreate) {
              next(null, accountsToCreate - addressCount);
            } else {
              next(ACCOUNTS_ALREADY_PRESENT);
            }
          });
        },
        function newAccounts(accountsToCreate, next) {
          var accountNumber = 0;
          async.whilst(
            function (cb) {
              cb(null, accountNumber < accountsToCreate);
            },
            function (callback) {
              accountNumber++;
              self.runCommand(self.client.newAccountCommand(), {}, (err, stdout, _stderr) => {
                if (err) {
                  return callback(err, accountNumber);
                }
                self.config.unlockAddressList.push(self.client.parseNewAccountCommandResultToAddress(stdout));
                callback(null, accountNumber);
              });
            },
            function (err) {
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
  }

  initChainAndGetAddress(callback) {
    const self = this;
    let address = null;
    const ALREADY_INITIALIZED = 'already';

    // ensure datadir exists, bypassing the interactive liabilities prompt.
    self.datadir = self.config.datadir;

    async.waterfall([
      function makeDir(next) {
        fs.mkdirp(self.datadir, (err, _result) => {
          next(err);
        });
      },
      function listAccounts(next) {
        self.runCommand(self.client.listAccountsCommand(), {}, (err, stdout, _stderr) => {
          if (err || stdout === undefined || stdout.indexOf("Fatal") >= 0) {
            self.logger.info(__("no accounts found").green);
            return next();
          }
          let firstAccountFound = self.client.parseListAccountsCommandResultToAddress(stdout);
          if (firstAccountFound === undefined || firstAccountFound === "") {
            console.log(__("no accounts found").green);
            return next();
          }
          self.logger.info(__("already initialized").green);
          address = firstAccountFound;
          next(ALREADY_INITIALIZED);
        });
      },
      function genesisBlock(next) {
        //There's no genesis init with Parity. Custom network are set in the chain property at startup
        if (!self.config.genesisBlock || self.client.name === constants.blockchain.clients.parity) {
          return next();
        }
        self.logger.info(__("initializing genesis block").green);
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
  }
}

export class BlockchainClient extends Blockchain {
  constructor(userConfig, options) {
    if ((userConfig === {} || JSON.stringify(userConfig) === '{"enabled":true}') && options.env !== 'development') {
      options.logger.info("===> " + __("warning: running default config on a non-development environment"));
    }
    // if client is not set in preferences, default is parity
    if (!userConfig.client) userConfig.client = constants.blockchain.clients.parity;
    // if clientName is set, it overrides preferences
    if (options.clientName) userConfig.client = options.clientName;
    // Choose correct client instance based on clientName
    let clientClass;
    switch (userConfig.client) {
      case constants.blockchain.clients.parity:
        clientClass = ParityClient;
        break;

        // case constants.blockchain.clients.parity:
        // clientClass = ParityClient;
        // break;
      default:
        console.error(__('Unknown client "%s". Please use one of the following: %s', userConfig.client, Object.keys(constants.blockchain.clients).join(', ')));
        process.exit(1);
    }
    userConfig.isDev = (userConfig.isDev || userConfig.default);
    userConfig.env = options.env;
    userConfig.onReadyCallback = options.onReadyCallback;
    userConfig.onExitCallback = options.onExitCallback;
    userConfig.logger = options.logger;
    userConfig.certOptions = options.certOptions;
    userConfig.isStandalone = options.isStandalone;

    super(userConfig, clientClass);
  }
}
