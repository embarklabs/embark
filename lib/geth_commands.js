
var GethCommands = function(options) {
  this.config = options.config;
  this.name = "Go-Ethereum (https://github.com/ethereum/go-ethereum)";
};

GethCommands.prototype.initGenesisCommmand = function() {
  var config = this.config;
  var cmd = "geth ";

  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  }

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.genesisBlock) {
    cmd += "init \"" + config.genesisBlock + "\" ";
  }

  return cmd;
};

GethCommands.prototype.newAccountCommand = function() {
  var config = this.config;
  var cmd = "geth ";

  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  }

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.account && config.account.password) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd + "account new ";
};

GethCommands.prototype.listAccountsCommand = function() {
  var config = this.config;
  var cmd = "geth ";

  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  }

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.account && config.account.password) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd + "account list ";
};

GethCommands.prototype.mainCommand = function(address) {
  var config = this.config;
  var cmd = "geth ";
  var rpc_api = ['eth', 'web3'];

  if (config.datadir) {
    cmd += "--datadir=\"" + config.datadir + "\" ";
  }

  if (config.networkType === 'testnet') {
    cmd += "--testnet ";
  } else if (config.networkType === 'olympic') {
    cmd += "--olympic ";
  }

  if (config.networkType === 'custom') {
    cmd += "--networkid " + config.networkId + " ";
  }

  if (config.account && config.account.password) {
    cmd += "--password " + config.account.password + " ";
  }

  cmd += "--port " + "30303" + " ";
  cmd += "--rpc ";
  cmd += "--rpcport " + config.rpcPort + " ";
  cmd += "--rpcaddr " + config.rpcHost + " ";
  if (config.rpcCorsDomain) {
    // TODO: show gigantic warning when cors is set to *
    cmd += "--rpccorsdomain=\"" + config.rpcCorsDomain + "\" ";
  } else {
    // TODO: show warning when cors is not set
  }

  //"nodiscover": true,

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

