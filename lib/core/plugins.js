var Plugin = require('./plugin.js');
var utils = require('./utils.js');

var Plugins = function(options) {
  this.pluginList = options.plugins || [];
  this.interceptLogs = options.interceptLogs;
  this.plugins = [];
  // TODO: need backup 'NullLogger'
  this.logger = options.logger;
  this.events = options.events;
  this.config = options.config;
};

Plugins.prototype.loadPlugins = function() {
  var pluginConfig;
  for (var pluginName in this.pluginList) {
    pluginConfig = this.pluginList[pluginName];
    this.loadPlugin(pluginName, pluginConfig);
  }
};

Plugins.prototype.listPlugins = function() {
  var list = [];
  for (var className in this.pluginList) {
    list.push(className);
  }
  return list;
};

Plugins.prototype.loadPlugin = function(pluginName, pluginConfig) {
  var pluginPath = utils.joinPath(process.env.PWD, 'node_modules', pluginName);
  var plugin = require(pluginPath);

  var pluginWrapper = new Plugin({name: pluginName, pluginModule: plugin, pluginConfig: pluginConfig, logger: this.logger, pluginPath: pluginPath, interceptLogs: this.interceptLogs, events: this.events, config: this.config});
  pluginWrapper.loadPlugin();
  this.plugins.push(pluginWrapper);
};

Plugins.prototype.getPluginsFor = function(pluginType) {
  return this.plugins.filter(function(plugin) {
    return plugin.has(pluginType);
  });
};

module.exports = Plugins;
