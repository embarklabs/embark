const async = require('async');
const GethMiner = require('./miner');
const os = require('os');

const DEFAULTS = {
  "BIN": "geth",
  "NETWORK_TYPE": "custom",
  "NETWORK_ID": 1337,
  "RPC_API": ['eth', 'web3', 'net', 'debug', 'personal'],
  "WS_API": ['eth', 'web3', 'net', 'shh', 'debug', 'pubsub', 'personal'],
  "DEV_WS_API": ['eth', 'web3', 'net', 'shh', 'debug', 'pubsub', 'personal'],
  "TARGET_GAS_LIMIT": 8000000
};

// TODO: make all of this async
class GethClient {

  static get DEFAULTS() {
    return DEFAULTS;
  }

  constructor(options) {
    this.config = options && options.hasOwnProperty('config') ? options.config : {};
    this.env = options && options.hasOwnProperty('env') ? options.env : 'development';
    this.isDev = options && options.hasOwnProperty('isDev') ? options.isDev : (this.env === 'development');
    this.name = "geth";
    this.prettyName = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
    this.bin = this.config.ethereumClientBin || DEFAULTS.BIN;
    this.httpReady = false;
    this.wsReady = !this.config.wsRPC;
  }

  isReady(data) {
    if (data.indexOf('HTTP endpoint opened') > -1) {
      this.httpReady = true;
    }
    if (data.indexOf('WebSocket endpoint opened') > -1) {
      this.wsReady = true;
    }
    return this.httpReady && this.wsReady;
  }

  /**
   * Check if the client needs some sort of 'keep alive' transactions to avoid freezing by inactivity
   * @returns {boolean} if keep alive is needed
   */
  needKeepAlive() {
    // TODO: check version also (geth version < 1.8.15)
    if (this.isDev) {
      // Trigger regular txs due to a bug in geth (< 1.8.15) and stuck transactions in --dev mode.   
      return true;
    }
    return false;
  }

  commonOptions(firstAccount = false) {
    let config = this.config;
    let cmd = [];

    cmd.push(this.determineNetworkType(config));

    if (config.datadir) {
      cmd.push(`--datadir=${config.datadir}`);
    }

    if (config.syncMode) {
      cmd.push("--syncmode=" + config.syncMode);
    }

    // geth in dev mode needs the first account to have a blank password, so we use for convenience the same Parity's devpassword
    if (config.account && config.account.password) {
      if (firstAccount) cmd.push(`--password=${config.account.devPassword}`);
      else cmd.push(`--password=${config.account.password}`);
    }

    if (Number.isInteger(config.verbosity) && config.verbosity >= 0 && config.verbosity <= 5) {
      cmd.push("--verbosity=" + config.verbosity);
    }

    return cmd;
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

  initGenesisCommmand() {
    let config = this.config;
    let cmd = this.bin + " " + this.commonOptions().join(' ');
    if (config.genesisBlock) {
      cmd += " init \"" + config.genesisBlock + "\" ";
    }
    return cmd;
  }

  newAccountCommand(firstAccount = false) {
    if (!(this.config.account && this.config.account.password)) {
      console.warn(__('Your blockchain is missing a password and creating an account may fail. Please consider updating ').yellow + __('config/blockchain > account > password').cyan + __(' then re-run the command').yellow);
    }
    return this.bin + " " + this.commonOptions(firstAccount).join(' ') + " account new ";
  }

  parseNewAccountCommandResultToAddress(data = "") {
    if (data.match(/{(\w+)}/)) return "0x" + data.match(/{(\w+)}/)[1];
    return "";
  }

  listAccountsCommand() {
    return this.bin + " " + this.commonOptions().join(' ') + " account list ";
  }

  parseListAccountsCommandResultToAddress(data = "") {
    if (data.match(/{(\w+)}/)) return "0x" + data.match(/{(\w+)}/)[1];
    return "";
  }

  parseListAccountsCommandResultToAddressList(data = "") {
    let list = data.split(os.EOL);
    list.pop(); // Remove empty value
    return list.map(el => "0x" + el.match(/{(\w+)}/)[1]);
  }

  parseListAccountsCommandResultToAddressCount(data = "") {
    const count = this.parseListAccountsCommandResultToAddressList(data).length;
    return (count > 0 ? count : 0);
  }

  determineRpcOptions(config) {
    let cmd = [];
    cmd.push("--port=" + config.port);
    cmd.push("--rpc");
    cmd.push("--rpcport=" + config.rpcPort);
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

  determineWsOptions(config) {
    let cmd = [];
    if (config.wsRPC) {
      cmd.push("--ws");
      cmd.push("--wsport=" + config.wsPort);
      cmd.push("--wsaddr=" + config.wsHost);
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
    // No specific configuration needed for the dev chain
    return callback();
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
          args.push("--nodiscover");
          return callback(null, "--nodiscover");
        }
        callback(null, "");
      },
      function vmDebug(callback) {
        if (config.vmdebug) {
          args.push("--vmdebug");
          return callback(null, "--vmdebug");
        }
        callback(null, "");
      },
      function maxPeers(callback) {
        let cmd = "--maxpeers=" + config.maxpeers;
        args.push(cmd);
        callback(null, cmd);
      },
      function mining(callback) {
        if (config.mineWhenNeeded || config.mine) {
          args.push("--mine");
          return callback(null, "--mine");
        }
        callback("");
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
          rpc_api.push('shh');
          if (ws_api.indexOf('shh') === -1) {
            ws_api.push('shh');
          }
          args.push("--shh");
          return callback(null, "--shh ");
        }
        callback("");
      },
      function rpcApi(callback) {
        args.push('--rpcapi=' + rpc_api.join(','));
        callback(null, '--rpcapi=' + rpc_api.join(','));
      },
      function wsApi(callback) {
        args.push('--wsapi=' + ws_api.join(','));
        callback(null, '--wsapi=' + ws_api.join(','));
      },
      function accountToUnlock(callback) {
        if (self.isDev && self.config.unlockAddressList) {
          // The first address is the dev account, that is automatically unlocked by the client using blank password
          args.push("--unlock=" + self.config.unlockAddressList.slice(1));
          return callback(null, "--unlock=" + self.config.unlockAddressList.slice(1));
        }
        let accountAddress = "";
        if (config.account && config.account.address) {
          accountAddress = config.account.address;
        } else {
          accountAddress = address;
        }
        if (accountAddress) {
          if(!(self.config && self.config.account && self.config.account.password)){
            console.warn(__("\n===== Password needed =====\nPassword for account {{account}} not found. Unlocking this account may fail. Please ensure a password is specified in config/blockchain.js > {{env}} > account > password.\n", {account: address, env: self.env}));
          }
          args.push("--unlock=" + accountAddress);
          return callback(null, "--unlock=" + accountAddress);
        }
        callback(null, "");
      },
      function gasLimit(callback) {
        if (config.targetGasLimit) {
          args.push("--miner.gastarget=" + config.targetGasLimit);
          return callback(null, "--miner.gastarget=" + config.targetGasLimit);
        }
        callback(null, "");
      },
      function isDev(callback) {
        if (self.isDev) {
          args.push('--dev');
          return callback(null, '--dev');
        }
        callback(null, '');
      }
    ], function(err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.bin, args);
    });
  }
}

module.exports = GethClient;
