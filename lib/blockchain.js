var Deploy;
var Config = require('./config/config.js');

startChain = function(env) {
  config = (new Config.Blockchain()).loadConfigFile('config/blockchain.yml').config(env);

  address = config.account.address;

  cmd = "geth ";

  if (config.datadir !== "default") {
    cmd += "--datadir=\"" + config.datadir + "\" ";
    cmd += "--logfile=\"" + config.datadir + ".log\" ";
  }

  cmd += "--port " + config.port + " ";
  cmd += "--rpc ";
  cmd += "--rpcport " + config.rpcPort + " ";
  cmd += "--networkid " + config.networkId + " ";
  cmd += "--rpccorsdomain \"" + config.rpcWhitelist + "\" ";

  if (config.minerthreads !== void 0) {
    cmd += "--minerthreads \"" + config.minerthreads + "\" ";
  }

  cmd += "--mine ";

  if (config.account.password !== void 0) {
    cmd += "--password " + config.account.password + " ";
  }

  if (config.account.init) {
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

  if (config.console_toggle) {
    cmd += "console";
  }

  if (config.mine_when_needed) {
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

