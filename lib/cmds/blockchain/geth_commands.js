const async = require('async');

// TODO: make all of this async
class GethCommands {
  constructor(options) {
    this.config = options && options.hasOwnProperty('config') ? options.config : {};
    this.env = options && options.hasOwnProperty('env') ? options.env : 'development';
    this.isDev = options && options.hasOwnProperty('isDev') ? options.isDev : (this.env === 'development');
    this.name = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
    this.geth_bin = this.config.geth_bin || "geth";
  }

  commonOptions() {
    let config = this.config;
    let cmd = [];

    cmd.push(this.determineNetworkType(config));

    if (config.datadir) {
      cmd.push(`--datadir=${config.datadir}`);
    }

    if (config.syncmode || config.syncMode) {
      cmd.push("--syncmode=" + (config.syncmode || config.syncMode));
    }

    if (config.account && config.account.password) {
      cmd.push(`--password=${config.account.password}`);
    }

    if (Number.isInteger(config.verbosity) && config.verbosity >=0 && config.verbosity <= 5) {
      cmd.push("--verbosity=" + config.verbosity);
    }

    return cmd;
  }

  determineVersionCommand() {
    return this.geth_bin + " version";
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
    let cmd = this.geth_bin + " " + this.commonOptions().join(' ');

    if (config.genesisBlock) {
      cmd += " init \"" + config.genesisBlock + "\" ";
    }

    return cmd;
  }

  newAccountCommand() {
    return this.geth_bin + " " + this.commonOptions().join(' ') + " account new ";
  }

  listAccountsCommand() {
    return this.geth_bin + " " + this.commonOptions().join(' ') + " account list ";
  }

  determineRpcOptions(config) {
    let cmd = [];

    cmd.push("--port=" + config.port);
    cmd.push("--rpc");
    cmd.push("--rpcport=" + config.rpcPort);
    cmd.push("--rpcaddr=" + config.rpcHost);
    if (config.rpcCorsDomain) {
      if (config.rpcCorsDomain === '*') {
        console.log('==================================');
        console.log(__('rpcCorsDomain set to *'));
        console.log(__('make sure you know what you are doing'));
        console.log('==================================');
      }
      cmd.push("--rpccorsdomain=" + config.rpcCorsDomain);
    } else {
      console.log('==================================');
      console.log(__('warning: cors is not set'));
      console.log('==================================');
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
          console.log('==================================');
          console.log(__('wsOrigins set to *'));
          console.log(__('make sure you know what you are doing'));
          console.log('==================================');
        }
        cmd.push("--wsorigins=" + config.wsOrigins);
      } else {
        console.log('==================================');
        console.log(__('warning: wsOrigins is not set'));
        console.log('==================================');
      }
    }

    return cmd;
  }

  mainCommand(address, done) {
    let self = this;
    let config = this.config;
    let rpc_api = (this.config.rpcApi || ['eth', 'web3', 'net', 'debug']);
    let ws_api = (this.config.wsApi || ['eth', 'web3', 'net', 'debug']);

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
        let accountAddress = "";
        if(config.account && config.account.address) {
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
          args.push("--targetgaslimit=" + config.targetGasLimit);
          return callback(null, "--targetgaslimit=" + config.targetGasLimit);
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
    ], function (err) {
      if (err) {
        throw new Error(err.message);
      }
      return done(self.geth_bin, args);
    });
  }
}

module.exports = GethCommands;
