
var GethCommands = function(options) {
  this.config = options.config;
  this.name = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
};

GethCommands.prototype.commonOptions = function() {
  var config = this.config;
  var cmd = "";

  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  } else if (config.networkType === 'custom') {
    cmd += "--networkid " + config.networkId + " ";
  }

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.account && config.account.password) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd;
};

GethCommands.prototype.initGenesisCommmand = function() {
  var config = this.config;
  var cmd = "geth " + this.commonOptions();

  if (config.genesisBlock) {
    cmd += "init \"" + config.genesisBlock + "\" ";
  }

  return cmd;
};

GethCommands.prototype.newAccountCommand = function() {
  return "geth " + this.commonOptions() + "account new ";
};

GethCommands.prototype.listAccountsCommand = function() {
  return "geth " + this.commonOptions() + "account list ";
};

GethCommands.prototype.mainCommand = function(address) {
  var config = this.config;
  var cmd = "geth ";
  var rpc_api = ['eth', 'web3'];

  cmd += this.commonOptions();

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

  if (config.nodiscover) {
    cmd += "--nodiscover ";
  }

  if (config.mineWhenNeeded || config.mine) {
    cmd += "--mine ";
  }

  if (config.whisper) {
    cmd += "--shh ";
    rpc_api.push('shh');
  }

  cmd += '--rpcapi "' + rpc_api.join(',') + '" ';

  var accountAddress = config.account.address || address;
  if (accountAddress) {
    cmd += "--unlock=" + accountAddress + " ";
  }

  if (config.mineWhenNeeded) {
    cmd += "js .embark/development/js/mine.js";
  }

  return cmd;
};

module.exports = GethCommands;

