import {__} from 'embark-i18n';
const async = require('async');
const {spawn, exec} = require('child_process');
const path = require('path');
const constants = require('embark-core/constants');
const NethermindClient = require('./nethermindClient.js');
import {IPC} from 'embark-core';

import {compact, dappPath, defaultHost, dockerHostSwap, embarkPath} from 'embark-utils';
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

    // TODO I think we all do this in config.ts now
    if (this.userConfig.default || JSON.stringify(this.userConfig) === '{"client":"nethermind"}') {
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
    this.client = new clientClass({config: this.config, env: this.env, isDev: this.isDev, logger: this.logger});

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
    if (!this.isStandalone) {
      return;
    }
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
            logQueue.forEach(message => {
              this.ipc.request('blockchain:log', message);
            });
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
      function getMainCommand(next) {
        self.client.mainCommand(address, (cmd, args) => {
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

      self.child.stderr.on('data', (data) => {
        self.logger.info(`${self.client.name} error: ${data}`);
      });

      self.child.stdout.on('data', async (data) => {
        data = data.toString();
        if (!self.readyCalled && self.client.isReady(data)) {
          self.readyCalled = true;
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
}

export class BlockchainClient extends Blockchain {
  constructor(userConfig, options) {
    if (JSON.stringify(userConfig) === '{"enabled":true}' && options.env !== 'development') {
      options.logger.info("===> " + __("warning: running default config on a non-development environment"));
    }
    // if client is not set in preferences, default is parity
    if (!userConfig.client) userConfig.client = constants.blockchain.clients.parity;
    // if clientName is set, it overrides preferences
    if (options.clientName) userConfig.client = options.clientName;
    // Choose correct client instance based on clientName
    let clientClass;
    switch (userConfig.client) {
      case 'nethermind':
        clientClass = NethermindClient;
        break;
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
