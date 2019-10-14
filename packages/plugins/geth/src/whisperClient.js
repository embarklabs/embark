import { __ } from 'embark-i18n';
const async = require('async');
const GethMiner = require('./miner');
const semver = require('semver');
const constants = require('embark-core/constants');

const DEFAULTS = {
  "BIN": "geth",
  "VERSIONS_SUPPORTED": ">=1.8.14",
  "NETWORK_TYPE": "custom",
  "NETWORK_ID": 1337,
  "RPC_API": ['eth', 'web3', 'net', 'debug', 'personal'],
  "WS_API": ['eth', 'web3', 'net', 'shh', 'debug', 'pubsub', 'personal'],
  "DEV_WS_API": ['eth', 'web3', 'net', 'shh', 'debug', 'pubsub', 'personal'],
  "TARGET_GAS_LIMIT": 8000000
};

class WhisperGethClient {

  static get DEFAULTS() {
    return DEFAULTS;
  }

  constructor(options) {
    this.config = options && options.hasOwnProperty('config') ? options.config : {};
    this.communicationConfig = options.communicationConfig;
    this.env = options && options.hasOwnProperty('env') ? options.env : 'development';
    this.isDev = options && options.hasOwnProperty('isDev') ? options.isDev : (this.env === 'development');
    this.name = constants.blockchain.clients.geth;
    this.prettyName = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
    this.bin = this.config.ethereumClientBin || DEFAULTS.BIN;
    this.versSupported = DEFAULTS.VERSIONS_SUPPORTED;
    this.httpReady = false;
    this.wsReady = !this.config.wsRPC;
  }

  isReady(data) {
    if (data.indexOf('WebSocket endpoint opened') > -1) {
      this.wsReady = true;
    }
    return this.wsReady;
  }

  /**
   * Check if the client needs some sort of 'keep alive' transactions to avoid freezing by inactivity
   * @returns {boolean} if keep alive is needed
   */
  needKeepAlive() {
    return false;
  }

  commonOptions() {
    return ['--ipcdisable'];
  }

  getMiner() {
    return new GethMiner({datadir: this.config.datadir});
  }

  getBinaryPath() {
    return this.bin;
  }

  determineVersionCommand() {
    return this.bin + " version";
  }

  parseVersion(rawVersionOutput) {
    let parsed;
    const match = rawVersionOutput.match(/Version: (.*)/);
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
    let cmd;
    if (config.networkType === 'testnet') {
      cmd = "--testnet";
    } else if (config.networkType === 'rinkeby') {
      cmd = "--rinkeby";
    } else if (config.networkType === 'custom') {
      cmd = "--networkid=" + config.networkId;
    }
    return cmd;
  }

  runAsArchival(config) {
    return config.networkId === 1337 || config.archivalMode;
  }

  initGenesisCommmand() {
    return "";
  }

  newAccountCommand() {
    return "";
  }

  parseNewAccountCommandResultToAddress(data = "") {
    if (data.match(/{(\w+)}/)) return "0x" + data.match(/{(\w+)}/)[1];
    return "";
  }

  listAccountsCommand() {
    return "";
  }

  parseListAccountsCommandResultToAddress(data = "") {
    if (data.match(/{(\w+)}/)) return "0x" + data.match(/{(\w+)}/)[1];
    return "";
  }

  parseListAccountsCommandResultToAddressList(data = "") {
    const regex = RegExp(/{(\w+)}/g);
    let match;
    const accounts = [];
    while ((match = regex.exec(data)) !== null) {
      accounts.push('0x' + match[1]);
    }
    return accounts;
  }

  parseListAccountsCommandResultToAddressCount(_data = "") {
    return 0;
  }

  determineRpcOptions(config) {
    let cmd = [];
    cmd.push("--port=30304");
    cmd.push("--rpc");
    cmd.push("--rpcport=9998");
    cmd.push("--rpcaddr=" + config.rpcHost);

    if (config.rpcCorsDomain) {
      if (config.rpcCorsDomain === '*') {
        console.warn('==================================');
        console.warn(__('rpcCorsDomain set to *'));
        console.warn(__('make sure you know what you are doing'));
        console.warn('==================================');
      }
      cmd.push("--rpccorsdomain=" + config.rpcCorsDomain);
    } else {
      console.warn('==================================');
      console.warn(__('warning: cors is not set'));
      console.warn('==================================');
    }
    return cmd;
  }

  determineWsOptions(config, communicationConfig) {
    let cmd = [];
    if (config.wsRPC) {
      cmd.push("--ws");

      cmd.push(`--wsport=${communicationConfig.connection.port || config.wsPost++}`);
      cmd.push(`--wsaddr=${communicationConfig.connection.host || config.wsHost++}`);

      if (config.wsOrigins) {
        if (config.wsOrigins === '*') {
          console.warn('==================================');
          console.warn(__('wsOrigins set to *'));
          console.warn(__('make sure you know what you are doing'));
          console.warn('==================================');
        }
        cmd.push("--wsorigins=" + config.wsOrigins);
      } else {
        console.warn('==================================');
        console.warn(__('warning: wsOrigins is not set'));
        console.warn('==================================');
      }
    }
    return cmd;
  }

  initDevChain(datadir, callback) {
    callback();
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
      function wsOptions(callback) {
        let cmd = self.determineWsOptions(self.config, self.communicationConfig);
        args = args.concat(cmd);
        callback(null, cmd);
      },
      function dontGetPeers(callback) {
        if (config.nodiscover) {
          args.push("--nodiscover");
          return callback(null, "--nodiscover");
        }
        callback(null, "");
      },
     function maxPeers(callback) {
        let cmd = "--maxpeers=" + config.maxpeers;
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
        rpc_api.push('shh');
        if (ws_api.indexOf('shh') === -1) {
          ws_api.push('shh');
        }
        args.push("--shh");
        return callback(null, "--shh ");
      },
      function rpcApi(callback) {
        args.push('--rpcapi=' + rpc_api.join(','));
        callback(null, '--rpcapi=' + rpc_api.join(','));
      },
      function wsApi(callback) {
        args.push('--wsapi=' + ws_api.join(','));
        callback(null, '--wsapi=' + ws_api.join(','));
      }
    ], function(err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.bin, args);
    });
  }
}

module.exports = WhisperGethClient;
