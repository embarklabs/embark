const Haml = require('haml');

module.exports = function (embark) {
  // embark.registerServiceCheck('PluginService', function (cb) {
  //   cb({name: "ServiceName", status: "on"});
  // });

  embark.registerPipeline((embark.pluginConfig.files || ['**/*.haml']), function (opts) {
    return Haml.render(opts.source);
  });

  embark.registerContractConfiguration({
    "default": {
      "deploy": {
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

  embark.registerConsoleCommand({
    matches: ["hello"],
    description: 'Says Hello',
    process: (cmd, callback) => {
      callback(null, 'Hello there');
    }
  });

  embark.events.on("contractsDeployed", function() {
    embark.logger.info("plugin says:", ' your contracts have been deployed');
  });

};
