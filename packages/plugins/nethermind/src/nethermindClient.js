import {__} from 'embark-i18n';
const path = require('path');
const async = require('async');
const semver = require('semver');

const DEFAULTS = {
  "BIN": "Nethermind.Runner",
  "VERSIONS_SUPPORTED": ">=1.4.0",
  "NETWORK_TYPE": "custom",
  "NETWORK_ID": 1337,
  "RPC_API": ['eth', 'web3', 'net', 'debug', 'personal'],
  "WS_API": ['eth', 'web3', 'net', 'debug', 'pubsub', 'personal'],
  "DEV_WS_API": ['eth', 'web3', 'net', 'debug', 'pubsub', 'personal'],
  "TARGET_GAS_LIMIT": 8000000
};

const NETHERMIND_NAME = 'nethermind';

class NethermindClient {

  static get DEFAULTS() {
    return DEFAULTS;
  }

  constructor(options) {
    this.logger = options.logger;
    this.config = options.hasOwnProperty('config') ? options.config : {};
    this.env = options.hasOwnProperty('env') ? options.env : 'development';
    this.isDev = options.hasOwnProperty('isDev') ? options.isDev : (this.env === 'development');
    this.name = NETHERMIND_NAME;
    this.prettyName = "Nethermind (https://github.com/NethermindEth/nethermind)";
    this.bin = this.config.ethereumClientBin || DEFAULTS.BIN;
    this.versSupported = DEFAULTS.VERSIONS_SUPPORTED;
  }

  isReady(data) {
    return data.indexOf('Running server, url:') > -1;
  }

  commonOptions() {
    const config = this.config;
    const cmd = [];

    cmd.push(this.determineNetworkType(config));

    if (config.datadir) {
      // There isn't a real data dir, so at least we put the keys there
      cmd.push(`--KeyStore.KeyStoreDirectory=${config.datadir}`);
    }

    if (config.syncMode === 'light') {
      this.logger.warn('Light sync mode does not exist in Nethermind. Switching to fast');
      cmd.push("--Sync.FastSync=true");
    } else if (config.syncMode === 'fast') {
      cmd.push("--Sync.FastSync=true");
    }

    // In dev mode we store all users passwords in the devPassword file, so Parity can unlock all users from the start
    if (this.isDev && config.account && config.account.numAccounts) {
      cmd.push(`--Wallet.DevAccounts=${config.account.numAccounts}`);
    } else if (config.account && config.account.password) {
      // TODO find a way to see if we can set a password
      // cmd.push(`--password=${config.account.password}`);
    }

    // TODO reanable this when the log level is usable
    //  currently, you have to restart the client for the log level to apply and even then, it looks bugged
    // if (Number.isInteger(config.verbosity) && config.verbosity >= 0 && config.verbosity <= 5) {
    //   switch (config.verbosity) {
    //     case 0:
    //       cmd.push("--log=OFF");
    //       break;
    //     case 1:
    //       cmd.push("--log=ERROR");
    //       break;
    //     case 2:
    //       cmd.push("--log=WARN");
    //       break;
    //     case 3:
    //       cmd.push("--log=INFO");
    //       break;
    //     case 4:
    //       cmd.push("--log=DEBUG");
    //       break;
    //     case 5:
    //       cmd.push("--log=TRACE");
    //       break;
    //     default:
    //       cmd.push("--log=INFO");
    //       break;
    //   }
    // }

    return cmd;
  }

  getMiner() {
    console.warn(__("Miner requested, but Nethermind does not embed a miner! Use Geth or install ethminer (https://github.com/ethereum-mining/ethminer)").yellow);
    return;
  }

  getBinaryPath() {
    return this.bin;
  }

  determineVersionCommand() {
    let launcher = 'Nethermind.Launcher';
    if (this.config.ethereumClientBin) {
      // Replace the Runner by the Launcher in the path
      // This is done because the Runner does not have a version command, but the Launcher has one ¯\_(ツ)_/¯
      launcher =  this.config.ethereumClientBin.replace(path.basename(this.config.ethereumClientBin), launcher);
    }
    return `${launcher} --version`;
  }

  parseVersion(rawVersionOutput) {
    let parsed;
    const match = rawVersionOutput.match(/v([0-9.]+)/);
    if (match) {
      parsed = match[1].trim();
    }
    return parsed;
  }

  isSupportedVersion(parsedVersion) {
    let test;
    try {
      let v = semver(parsedVersion);
      v = `${v.major}.${v.minor}.${v.patch}`;
      test = semver.Range(this.versSupported).test(semver(v));
      if (typeof test !== 'boolean') {
        test = undefined;
      }
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return test;
    }
  }

  determineNetworkType(config) {
    if (this.isDev) {
      return "--config=ndm_consumer_local";
    }
    if (config.networkType === 'testnet') {
      config.networkType = "ropsten";
    }
    return "--config=" + config.networkType;
  }

  determineRpcOptions(config) {
    let cmd = [];
    cmd.push("--Network.DiscoveryPort=" + config.port);
    cmd.push("--JsonRpc.Port=" + config.rpcPort);
    cmd.push("--JsonRpc.Host=" + config.rpcHost);
    // Doesn't seem to support changing CORS
    // if (config.rpcCorsDomain) {
    //   if (config.rpcCorsDomain === '*') {
    //     console.warn('==================================');
    //     console.warn(__('rpcCorsDomain set to "all"'));
    //     console.warn(__('make sure you know what you are doing'));
    //     console.warn('==================================');
    //   }
    //   cmd.push("--jsonrpc-cors=" + (config.rpcCorsDomain === '*' ? 'all' : config.rpcCorsDomain));
    // } else {
    //   console.warn('==================================');
    //   console.warn(__('warning: cors is not set'));
    //   console.warn('==================================');
    // }
    return cmd;
  }

  determineWsOptions(config) {
    let cmd = [];
    if (config.wsRPC) {
      cmd.push("--Init.WebSocketsEnabled=true");
    }
    return cmd;
  }

  mainCommand(address, done) {
    let self = this;
    let config = this.config;
    let rpc_api = this.config.rpcApi;
    let args = [];
    async.waterfall([
      function commonOptions(callback) {
        let cmd = self.commonOptions();
        args = args.concat(cmd);
        callback();
      },
      function rpcOptions(callback) {
        let cmd = self.determineRpcOptions(self.config);
        args = args.concat(cmd);
        callback();
      },
      function wsOptions(callback) {
        let cmd = self.determineWsOptions(self.config);
        args = args.concat(cmd);
        callback();
      },
      function dontGetPeers(callback) {
        if (config.nodiscover) {
          args.push("--Init.DiscoveryEnabled=false");
          return callback();
        }
        callback();
      },
      function vmDebug(callback) {
        if (config.vmdebug) {
          args.push("----Init.StoreTraces=true");
          return callback();
        }
        callback();
      },
      function maxPeers(callback) {
        args.push("--Network.ActivePeersMaxCount=" + config.maxpeers);
        callback();
      },
      function bootnodes(callback) {
        if (config.bootnodes && config.bootnodes !== "") {
          args.push("--Discovery.Bootnodes=" + config.bootnodes);
          return callback();
        }
        callback();
      },
      function rpcApi(callback) {
        args.push('--JsonRpc.EnabledModules=' + rpc_api.join(','));
        callback();
      },
      function customOptions(callback) {
        if (config.customOptions) {
          if (Array.isArray(config.customOptions)) {
            config.customOptions = config.customOptions.join(' ');
          }
          args.push(config.customOptions);
          return callback();
        }
        callback();
      }
    ], function (err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.bin, args);
    });
  }
}

module.exports = NethermindClient;
