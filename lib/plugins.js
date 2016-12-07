var Plugin = require('./plugin.js');
var path = require('path');

var Plugins = function(options) {
  this.pluginList = options.plugins || [];
  this.plugins = [];
};

Plugins.prototype.loadPlugins = function() {
  var i, plugin;
  for (i = 0; i < this.pluginList.length; i++) {
    plugin = this.pluginList[i];
    this.loadPlugin(plugin);
  }
};

Plugins.prototype.loadPlugin = function(pluginName) {
  var plugin = require(path.join(process.env.PWD, 'node_modules', pluginName));

  var pluginWrapper = new Plugin({name: pluginName, pluginModule: plugin});
  pluginWrapper.loadPlugin();
  this.plugins.push(pluginWrapper);
};

Plugins.prototype.getPluginsFor = function(pluginType) {
  return this.plugins.filter(function(plugin) {
    return plugin.has(pluginType);
  });
};

module.exports = Plugins;
