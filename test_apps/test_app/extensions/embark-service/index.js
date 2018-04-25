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
};
