module.exports = function(embark) {
  embark.registerServiceCheck('PluginService', function(cb) {
    cb({name: "ServiceName", status: "on"});
  });
};
