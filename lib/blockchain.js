var Deploy;
var readYaml = require('read-yaml');

startChain = function(env) {
  try {
    blockchainConfig = readYaml.sync("config/blockchain.yml");
  } catch (_error) {
    exception = _error;
    console.log("==== error reading config/blockchain.yml");
    console.log(exception);
  }

  rpcHost = blockchainConfig[env].rpc_host;

  rpcPort = blockchainConfig[env].rpc_port;

  rpcWhitelist = blockchainConfig[env].rpc_whitelist;

  minerthreads = blockchainConfig[env].minerthreads;

  datadir = blockchainConfig[env].datadir;

  networkId = blockchainConfig[env].network_id || Math.floor((Math.random() * 100000) + 1000);

  port = blockchainConfig[env].port || "30303";

  console_toggle = blockchainConfig[env].console || false;

  mine_when_needed = blockchainConfig[env].mine_when_needed || false;

  account = blockchainConfig[env].account;

  address = account.address;

  cmd = "geth ";

  if (datadir !== "default") {
    cmd += "--datadir=\"" + datadir + "\" ";
    cmd += "--logfile=\"" + datadir + ".log\" ";
  }

  cmd += "--port " + port + " ";

  cmd += "--rpc ";

  cmd += "--rpcport " + rpcPort + " ";

  cmd += "--networkid " + networkId + " ";

  cmd += "--rpccorsdomain \"" + rpcWhitelist + "\" ";

  if (minerthreads !== void 0) {
    cmd += "--minerthreads \"" + minerthreads + "\" ";
  }

  cmd += "--mine ";

  if (account.password !== void 0) {
    cmd += "--password " + account.password + " ";
  }

  if (account.init) {
    console.log("=== initializating account");
    console.log("running: " + cmd + " account list");
    result = exec(cmd + "account list");
    console.log("finished");
    console.log("=== output is " + result.output);
    if (result.output.indexOf("Fatal") < 0) {
      console.log("=== already initialized");
      address = result.output.match(/{(\w+)}/)[1];
    } else {
      console.log("running: " + cmd + " account new");
      output = exec(cmd + " account new");
      address = output.output.match(/{(\w+)}/)[1];
    }
  }

  if (address !== void 0) {
    cmd += "--unlock " + address + " ";
  }

  if (console_toggle) {
    cmd += "console";
  }

  if (mine_when_needed) {
    cmd += "js node_modules/embark-framework/js/mine.js";
  }

  console.log("running: " + cmd);

  console.log("=== running geth");

  exec(cmd);
}

Blockchain = {
  startChain: startChain
}

module.exports = Blockchain

