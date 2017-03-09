var async = require('async');

// TODO: make all of this async
var GethCommands = function(options) {
  this.config = options.config;
  this.env = options.env || 'development';
  this.name = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
  this.geth_bin = this.config.geth_bin || "geth";
};

GethCommands.prototype.commonOptions = function() {
  var config = this.config;
  var cmd = "";

  cmd += this.determineNetworkType(config);

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.light) {
    cmd += "--light ";
  }

  if (config.fast) {
    cmd += "--fast ";
  }

  if (config.account && config.account.password) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd;
};

GethCommands.prototype.determineNetworkType = function(config) {
  var cmd = "";
  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  } else if (config.networkType === 'custom') {
    cmd += "--networkid " + config.networkId + " ";
  }
  return cmd;
};

GethCommands.prototype.initGenesisCommmand = function() {
  var config = this.config;
  var cmd = this.geth_bin + " " + this.commonOptions();

  if (config.genesisBlock) {
    cmd += "init \"" + config.genesisBlock + "\" ";
  }

  return cmd;
};

GethCommands.prototype.newAccountCommand = function() {
  return this.geth_bin + " " + this.commonOptions() + "account new ";
};

GethCommands.prototype.listAccountsCommand = function() {
  return this.geth_bin + " " + this.commonOptions() + "account list ";
};

GethCommands.prototype.determineRpcOptions = function(config) {
  var cmd = "";

  cmd += "--port " + config.port + " ";
  cmd += "--rpc ";
  cmd += "--rpcport " + config.rpcPort + " ";
  cmd += "--rpcaddr " + config.rpcHost + " ";
  if (config.rpcCorsDomain) {
    if (config.rpcCorsDomain === '*') {
      console.log('==================================');
      console.log('make sure you know what you are doing');
      console.log('==================================');
    }
    cmd += "--rpccorsdomain=\"" + config.rpcCorsDomain + "\" ";
  } else {
    console.log('==================================');
    console.log('warning: cors is not set');
    console.log('==================================');
  }

  return cmd;
};

GethCommands.prototype.mainCommand = function(address, done) {
  var self = this;
  var config = this.config;
  var rpc_api = (this.config.rpcApi || ['eth', 'web3', 'net']);

  async.series([
    function commonOptions(callback) {
      var cmd = self.commonOptions();
      callback(null, cmd);
    },
    function rpcOptions(callback) {
      var cmd = self.determineRpcOptions(self.config);
      callback(null, cmd);
    },
    function dontGetPeers(callback) {
      if (config.nodiscover) {
        return callback(null, "--nodiscover");
      }
      callback(null, "");
    },
    function vmDebug(callback) {
      if (config.vmdebug) {
        return callback(null, "--vmdebug");
      }
      callback(null, "");
    },
    function maxPeers(callback) {
      var cmd = "--maxpeers " + config.maxpeers;
      callback(null, cmd);
    },
    function mining(callback) {
      if (config.mineWhenNeeded || config.mine) {
        return callback(null, "--mine ");
      }
      callback("");
    },
    function bootnodes(callback) {
      if (config.bootnodes && config.bootnodes !== "" && config.bootnodes !== []) {
        return callback(null, "--bootnodes " + config.bootnodes);
      }
      callback("");
    },
    function whisper(callback) {
      if (config.whisper) {
        rpc_api.push('shh');
        return callback(null, "--shh ");
      }
      callback("");
    },
    function rpcApi(callback) {
      callback(null, '--rpcapi "' + rpc_api.join(',') + '"');
    },
    function accountToUnlock(callback) {
      var accountAddress = config.account.address || address;
      if (accountAddress) {
        return callback(null, "--unlock=" + accountAddress);
      }
      callback(null, "");
    },
    function mineWhenNeeded(callback) {
      if (config.mineWhenNeeded) {
        return callback(null, "js .embark/" + self.env + "/js/mine.js");
      }
      callback(null, "");
    }
  ], function(err, results) {
    if (err) {
      throw new Error(err.message);
    }
    done(self.geth_bin + " " + results.join(" "));
  });
};

module.exports = GethCommands;

