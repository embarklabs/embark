import {__} from 'embark-i18n';
import {dappPath} from 'embark-utils';
import * as fs from 'fs-extra';
const async = require('async');
const path = require('path');
const os = require('os');
const semver = require('semver');
const constants = require('embark-core/constants');

const DEFAULTS = {
  "BIN": "parity",
  "VERSIONS_SUPPORTED": ">=2.2.1",
  "NETWORK_TYPE": "dev",
  "NETWORK_ID": 17,
  "RPC_API": ["web3", "eth", "pubsub", "net", "parity", "private", "parity_pubsub", "traces", "rpc", "shh", "shh_pubsub"],
  "WS_API": ["web3", "eth", "pubsub", "net", "parity", "private", "parity_pubsub", "traces", "rpc", "shh", "shh_pubsub"],
  "DEV_WS_API": ["web3", "eth", "pubsub", "net", "parity", "private", "parity_pubsub", "traces", "rpc", "shh", "shh_pubsub", "personal"],
  "TARGET_GAS_LIMIT": 8000000,
  "DEV_ACCOUNT": "0x00a329c0648769a73afac7f9381e08fb43dbea72",
  "DEV_WALLET": {
    "id": "d9460e00-6895-8f58-f40c-bb57aebe6c00",
    "version": 3,
    "crypto": {
      "cipher": "aes-128-ctr",
      "cipherparams": {"iv": "74245f453143f9d06a095c6e6e309d5d"},
      "ciphertext": "2fa611c4aa66452ef81bd1bd288f9d1ed14edf61aa68fc518093f97c791cf719",
      "kdf": "pbkdf2",
      "kdfparams": {"c": 10240, "dklen": 32, "prf": "hmac-sha256", "salt": "73b74e437a1144eb9a775e196f450a23ab415ce2c17083c225ddbb725f279b98"},
      "mac": "f5882ae121e4597bd133136bf15dcbcc1bb2417a25ad205041a50c59def812a8"
    },
    "address": "00a329c0648769a73afac7f9381e08fb43dbea72",
    "name": "Development Account",
    "meta": "{\"description\":\"Never use this account outside of development chain!\",\"passwordHint\":\"Password is empty string\"}"
  }
};

const safePush = function (set, value) {
  if (set.indexOf(value) === -1) {
    set.push(value);
  }
};

class ParityClient {

  static get DEFAULTS() {
    return DEFAULTS;
  }

  constructor(options) {
    this.config = options && options.hasOwnProperty('config') ? options.config : {};
    this.env = options && options.hasOwnProperty('env') ? options.env : 'development';
    this.isDev = options && options.hasOwnProperty('isDev') ? options.isDev : (this.env === 'development');
    this.name = constants.blockchain.clients.parity;
    this.prettyName = "Parity-Ethereum (https://github.com/paritytech/parity-ethereum)";
    this.bin = this.config.ethereumClientBin || DEFAULTS.BIN;
    this.versSupported = DEFAULTS.VERSIONS_SUPPORTED;
  }

  isReady(data) {
    return data.indexOf('Public node URL') > -1;
  }

  /**
   * Check if the client needs some sort of 'keep alive' transactions to avoid freezing by inactivity
   * @returns {boolean} if keep alive is needed
   */
  needKeepAlive() {
    return false;
  }

  commonOptions() {
    let config = this.config;
    let cmd = [];

    cmd.push(this.determineNetworkType(config));

    if (config.networkId) {
      cmd.push(`--network-id=${config.networkId}`);
    }

    if (config.datadir) {
      cmd.push(`--base-path=${config.datadir}`);
    }

    if (config.syncMode === 'light') {
      cmd.push("--light");
    } else if (config.syncMode === 'fast') {
      cmd.push("--pruning=fast");
    } else if (config.syncMode === 'full') {
      cmd.push("--pruning=archive");
    }

    // In dev mode we store all users passwords in the devPassword file, so Parity can unlock all users from the start
    if (this.isDev) cmd.push(`--password=${config.account.devPassword}`);
    else if (config.account && config.account.password) {
      cmd.push(`--password=${config.account.password}`);
    }

    if (Number.isInteger(config.verbosity) && config.verbosity >= 0 && config.verbosity <= 5) {
      switch (config.verbosity) {
        case 0: // No option to silent Parity, go to less verbose
        case 1:
          cmd.push("--logging=error");
          break;
        case 2:
          cmd.push("--logging=warn");
          break;
        case 3:
          cmd.push("--logging=info");
          break;
        case 4: // Debug is the max verbosity for Parity
        case 5:
          cmd.push("--logging=debug");
          break;
        default:
          cmd.push("--logging=info");
          break;
      }
    }

    if (this.runAsArchival(config)) {
      cmd.push("--pruning=archive");
    }

    return cmd;
  }

  getMiner() {
    console.warn(__("Miner requested, but Parity does not embed a miner! Use Geth or install ethminer (https://github.com/ethereum-mining/ethminer)").yellow);
    return;
  }

  getBinaryPath() {
    return this.bin;
  }

  determineVersionCommand() {
    return this.bin + " --version";
  }

  parseVersion(rawVersionOutput) {
    let parsed;
    const match = rawVersionOutput.match(/version Parity(?:-Ethereum)?\/(.*?)\//);
    if (match) {
      parsed = match[1].trim();
    }
    return parsed;
  }

  runAsArchival(config) {
    return config.networkId === 1337 || config.archivalMode;
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
      return "--chain=dev";
    }
    if (config.networkType === 'rinkeby') {
      console.warn(__('Parity does not support the Rinkeby PoA network, switching to Kovan PoA network'));
      config.networkType = 'kovan';
    } else if (config.networkType === 'testnet') {
      console.warn(__('Parity "testnet" corresponds to Kovan network, switching to Ropsten to be compliant with Geth parameters'));
      config.networkType = "ropsten";
    }
    if (config.genesisBlock) {
      config.networkType = config.genesisBlock;
    }
    return "--chain=" + config.networkType;
  }

  newAccountCommand() {
    return this.bin + " " + this.commonOptions().join(' ') + " account new ";
  }

  parseNewAccountCommandResultToAddress(data = "") {
    return data.replace(/^\n|\n$/g, "");
  }

  listAccountsCommand() {
    return this.bin + " " + this.commonOptions().join(' ') + " account list ";
  }

  parseListAccountsCommandResultToAddress(data = "") {
    return data.replace(/^\n|\n$/g, "").split('\n')[0];
  }

  parseListAccountsCommandResultToAddressList(data = "") {
    const list = data.split('\n');
    return list.filter(acc => acc);
  }

  parseListAccountsCommandResultToAddressCount(data = "") {
    const count = this.parseListAccountsCommandResultToAddressList(data).length;
    return (count > 0 ? count : 0);
  }

  determineRpcOptions(config) {
    let cmd = [];
    cmd.push("--port=" + config.port);
    cmd.push("--jsonrpc-port=" + config.rpcPort);
    cmd.push("--jsonrpc-interface=" + (config.rpcHost === 'localhost' ? 'local' : config.rpcHost));
    if (config.rpcCorsDomain) {
      if (config.rpcCorsDomain === '*') {
        console.warn('==================================');
        console.warn(__('rpcCorsDomain set to "all"'));
        console.warn(__('make sure you know what you are doing'));
        console.warn('==================================');
      }
      cmd.push("--jsonrpc-cors=" + (config.rpcCorsDomain === '*' ? 'all' : config.rpcCorsDomain));
    } else {
      console.warn('==================================');
      console.warn(__('warning: cors is not set'));
      console.warn('==================================');
    }
    cmd.push("--jsonrpc-hosts=all");
    return cmd;
  }

  determineWsOptions(config) {
    let cmd = [];
    if (config.wsRPC) {
      cmd.push("--ws-port=" + config.wsPort);
      cmd.push("--ws-interface=" + (config.wsHost === 'localhost' ? 'local' : config.wsHost));
      if (config.wsOrigins) {
        const origins = config.wsOrigins.split(',');
        if (origins.includes('*') || origins.includes("all")) {
          console.warn('==================================');
          console.warn(__('wsOrigins set to "all"'));
          console.warn(__('make sure you know what you are doing'));
          console.warn('==================================');
          cmd.push("--ws-origins=all");
        } else {
          cmd.push("--ws-origins=" + config.wsOrigins);
        }
      } else {
        console.warn('==================================');
        console.warn(__('warning: wsOrigins is not set'));
        console.warn('==================================');
      }
      cmd.push("--ws-hosts=all");
    }
    return cmd;
  }

  initDevChain(datadir, callback) {
    // Parity requires specific initialization also for the dev chain
    const self = this;
    const keysDataDir = datadir + '/keys/DevelopmentChain';
    async.waterfall([
      function makeDir(next) {
        fs.mkdirp(keysDataDir, (err, _result) => {
          next(err);
        });
      },
      function createDevAccount(next) {
        self.createDevAccount(keysDataDir, next);
      },
      function mkDevPasswordDir(next) {
        fs.mkdirp(path.dirname(self.config.account.devPassword), (err, _result) => {
          next(err);
        });
      },
      function getText(next) {
        if (!self.config.account.password) {
          return next(null, os.EOL + 'dev_password');
        }
        fs.readFile(dappPath(self.config.account.password), {encoding: 'utf8'}, (err, content) => {
          next(err, os.EOL + content);
        });
      },
      function updatePasswordFile(passwordList, next) {
        fs.writeFile(self.config.account.devPassword, passwordList, next);
      }
    ], (err) => {
      callback(err);
    });
  }

  createDevAccount(keysDataDir, cb) {
    const devAccountWallet = keysDataDir + '/dev.wallet';
    fs.writeFile(devAccountWallet, JSON.stringify(DEFAULTS.DEV_WALLET), function (err) {
      if (err) {
        return cb(err);
      }
      cb();
    });
  }

  mainCommand(address, done) {
    let self = this;
    let config = this.config;
    let rpc_api = this.config.rpcApi;
    let ws_api = this.config.wsApi;
    let args = [];
    async.series([
      function commonOptions(callback) {
        let cmd = self.commonOptions();
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function rpcOptions(callback) {
        let cmd = self.determineRpcOptions(self.config);
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function wsOptions(callback) {
        let cmd = self.determineWsOptions(self.config);
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function dontGetPeers(callback) {
        if (config.nodiscover) {
          args.push("--no-discovery");
          return callback(null, "--no-discovery");
        }
        callback(null, "");
      },
      function vmDebug(callback) {
        if (config.vmdebug) {
          args.push("--tracing on");
          return callback(null, "--tracing on");
        }
        callback(null, "");
      },
      function maxPeers(callback) {
        let cmd = "--max-peers=" + config.maxpeers;
        args.push(cmd);
        callback(null, cmd);
      },
      function bootnodes(callback) {
        if (config.bootnodes && config.bootnodes !== "" && config.bootnodes !== []) {
          args.push("--bootnodes=" + config.bootnodes);
          return callback(null, "--bootnodes=" + config.bootnodes);
        }
        callback("");
      },
      function whisper(callback) {
        if (config.whisper) {
          safePush(rpc_api, 'shh');
          safePush(rpc_api, 'shh_pubsub');
          safePush(ws_api, 'shh');
          safePush(ws_api, 'shh_pubsub');
          args.push("--whisper");
          return callback(null, "--whisper");
        }
        callback("");
      },
      function rpcApi(callback) {
        args.push('--jsonrpc-apis=' + rpc_api.join(','));
        callback(null, '--jsonrpc-apis=' + rpc_api.join(','));
      },
      function wsApi(callback) {
        args.push('--ws-apis=' + ws_api.join(','));
        callback(null, '--ws-apis=' + ws_api.join(','));
      },
      function accountToUnlock(callback) {
        if (self.isDev) {
          let unlockAddressList = self.config.unlockAddressList ? self.config.unlockAddressList : DEFAULTS.DEV_ACCOUNT;
          args.push("--unlock=" + unlockAddressList);
          return callback(null, "--unlock=" + unlockAddressList);
        }
        let accountAddress = "";
        if (config.account && config.account.address) {
          accountAddress = config.account.address;
        } else {
          accountAddress = address;
        }
        if (accountAddress && !self.isDev) {
          args.push("--unlock=" + accountAddress);
          return callback(null, "--unlock=" + accountAddress);
        }
        callback(null, "");
      },
      function gasLimit(callback) {
        if (config.targetGasLimit) {
          args.push("--gas-floor-target=" + config.targetGasLimit);
          return callback(null, "--gas-floor-target=" + config.targetGasLimit);
        }
        // Default Parity gas limit is 4700000: let's set to the geth default
        args.push("--gas-floor-target=" + DEFAULTS.TARGET_GAS_LIMIT);
        return callback(null, "--gas-floor-target=" + DEFAULTS.TARGET_GAS_LIMIT);
      },
      function customOptions(callback) {
        if (config.customOptions) {
          if (Array.isArray(config.customOptions)) {
            config.customOptions = config.customOptions.join(' ');
          }
          args.push(config.customOptions);
          return callback(null, config.customOptions);
        }
        callback(null, '');
      }
    ], function (err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.bin, args);
    });
  }
}

module.exports = ParityClient;
