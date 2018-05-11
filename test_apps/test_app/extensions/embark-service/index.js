const Haml = require('haml');

module.exports = function (embark) {
  embark.registerServiceCheck('PluginService', function (cb) {
    cb({name: "ServiceName", status: "on"});
  });

  embark.registerPipeline((embark.pluginConfig.files || ['**/*.haml']), function (opts) {
    return Haml.render(opts.source);
  });

  embark.registerContractConfiguration({
    "default": {
      "contracts": {
        "PluginStorage": {
          "args": ["$SimpleStorage"]
        }
      }
    }
  });
  embark.addContractFile("./contracts/pluginSimpleStorage.sol");

  embark.addFileToPipeline('./fileInPipeline.js');
  embark.addFileToPipeline('./fileInPipeline.js', 'js/fileInPipeline.js');

  embark.registerBeforeDeploy(function (options, callback) {
    // Just calling register to prove it works. We don't actually want to change the contracts
    callback({contractCode: options.contract.code});
  });

  //embark.registerClientWeb3Provider(function(options) {
  //  return "web3 = new Web3(new Web3.providers.HttpProvider('http://" + options.rpcHost + ":" + options.rpcPort + "'));";
  //});

  embark.registerConsoleCommand((cmd) => {
    if (cmd === "hello") {
      return "hello there!";
    }
    // continue to embark or next plugin;
    return false;
  });

  embark.events.on("contractsDeployed", function() {
    embark.logger.info("plugin says: your contracts have been deployed");
  });

};
