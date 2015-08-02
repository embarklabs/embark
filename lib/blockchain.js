var mkdirp = require('mkdirp');

Blockchain = function(blockchainConfig) {
  this.config = blockchainConfig;
}

Blockchain.prototype.generate_basic_command = function() {
  var config = this.config;
  var address = config.account.address;

  var cmd = "geth ";

  if (config.datadir !== "default") {
    cmd += "--datadir=\"" + config.datadir + "\" ";
    cmd += "--logfile=\"" + config.datadir + ".log\" ";
  }

  cmd += "--port " + config.port + " ";
  cmd += "--rpc ";
  cmd += "--rpcport " + config.rpcPort + " ";
  cmd += "--rpcaddr " + config.rpcHost + " ";
  cmd += "--networkid " + config.networkId + " ";
  cmd += "--rpccorsdomain \"" + config.rpcWhitelist + "\" ";

  if (config.minerthreads !== void 0) {
    cmd += "--minerthreads \"" + config.minerthreads + "\" ";
  }

  cmd += "--mine ";
  if (config.genesisBlock !== void 0) {
    cmd += "--genesis=\"" + config.genesisBlock + "\" ";
  }

  //TODO: this should be configurable
  cmd += "--maxpeers " + config.maxPeers + " ";

  if (config.account.password !== void 0) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd;
}

Blockchain.prototype.list_command = function() {
  return this.generate_basic_command() + "account list ";
}

Blockchain.prototype.init_command = function() {
  return this.generate_basic_command() + "account new ";
}

Blockchain.prototype.run_command = function(address, use_tmp) {
  var cmd = this.generate_basic_command();
  var config = this.config;

  if (address !== void 0) {
    cmd += "--unlock " + address + " ";
  }

  if (config.console_toggle) {
    cmd += "console";
  }

  if (config.mine_when_needed) {
    if (use_tmp) {
      cmd += "js /tmp/js/mine.js";
    }
    else {
      cmd += "js node_modules/embark-framework/js/mine.js";
    }
  }

  return cmd;
}

Blockchain.prototype.get_address = function() {
  var config = this.config;
  var address = null;

  if (config.account.init) {
    // ensure datadir exists, bypassing the interactive liabilities prompt.
    var newDir = mkdirp.sync(config.datadir);
    if (newDir) {
      console.log("=== datadir created");
    } else {
      console.log("=== datadir already exists");
    }

    console.log("running: " + this.list_command());
    result = exec(this.list_command());

    if (result.output.indexOf("Fatal") < 0) {
      console.log("=== already initialized");
      address = result.output.match(/{(\w+)}/)[1];
    } else {
      console.log("running: " + this.init_command());
      result = exec(this.init_command());
      address = result.output.match(/{(\w+)}/)[1];
    }
  }

  return address;
}

Blockchain.prototype.startChain = function(use_tmp) {
  var address = this.get_address();
  console.log("running: " + this.run_command(address, use_tmp));
  exec(this.run_command(address, use_tmp));
}

module.exports = Blockchain
