const Haml = require('haml');

module.exports = function (embark) {
  embark.registerServiceCheck('PluginService', function (cb) {
    cb({name: "ServiceName", status: "on"});
  });

  embark.registerPipeline((embark.pluginConfig.files || ['**/*.haml']), function (opts) {
    return Haml.render(opts.source);
  });

  embark.logger.info('patente', 'a goosee');
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

  embark.registerActionForEvent("deploy:contract:beforeDeploy", (params, cb) => {
    embark.logger.info("applying beforeDeploy plugin...");
    cb();
  });

  embark.registerConsoleCommand((cmd) => {
    if (cmd === "hello") {
      return "hello there!";
    }
    // continue to embark or next plugin;
    return false;
  });

  embark.events.on("contractsDeployed", function() {
    embark.logger.info("plugin says:", ' your contracts have been deployed');
  });

};
