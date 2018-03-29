var Haml = require('haml');

module.exports = function(embark) {
  embark.registerServiceCheck('PluginService', function(cb) {
    cb({name: "ServiceName", status: "on"});
  });

  embark.registerPipeline((embark.pluginConfig.files || ['**/*.haml']), function(opts) {
    var source = opts.source;
    return Haml.render(source);
  });
};
