var Plugin = require('./plugin.js');
var utils = require('../utils/utils.js');

var Plugins = function(options) {
  this.pluginList = options.plugins || [];
  this.interceptLogs = options.interceptLogs;
  this.plugins = [];
  // TODO: need backup 'NullLogger'
  this.logger = options.logger;
  this.events = options.events;
  this.config = options.config;
  this.context = options.context;
};

Plugins.prototype.loadPlugins = function() {
  var pluginConfig;
  for (var pluginName in this.pluginList) {
    pluginConfig = this.pluginList[pluginName];
    this.loadPlugin(pluginName, pluginConfig);
  }
};

Plugins.prototype.listPlugins = function() {
  const list = [];
  this.plugins.forEach(plugin => {
    if (plugin.loaded) {
      list.push(plugin.name);
    }
  });
  return list;
};

// for services that act as a plugin but have core functionality
Plugins.prototype.createPlugin = function(pluginName, pluginConfig) {
  let plugin = {};
  let pluginPath = false;
  var pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig,
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    isInternal: true,
    context: this.context
  });
  this.plugins.push(pluginWrapper);
  return pluginWrapper;
};

Plugins.prototype.loadInternalPlugin = function(pluginName, pluginConfig) {
  var pluginPath = utils.joinPath('../modules/', pluginName, 'index.js');
  var plugin = require(pluginPath);

  var pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig,
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    isInternal: true,
    context: this.context
  });
  pluginWrapper.loadInternalPlugin();
  this.plugins.push(pluginWrapper);
};

Plugins.prototype.loadPlugin = function(pluginName, pluginConfig) {
  var pluginPath = utils.joinPath(utils.pwd(), 'node_modules', pluginName);
  var plugin = require(pluginPath);

  var pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig,
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    isInternal: false,
    context: this.context
  });
  pluginWrapper.loadPlugin();
  this.plugins.push(pluginWrapper);
};

Plugins.prototype.getPluginsFor = function(pluginType) {
  return this.plugins.filter(function(plugin) {
    return plugin.has(pluginType);
  });
};

Plugins.prototype.getPluginsProperty = function(pluginType, property) {
  let matchingPlugins = this.plugins.filter(function(plugin) {
    return plugin.has(pluginType);
  });

  let matchingProperties = matchingPlugins.map((plugin) => {
    return plugin[property];
  });

  //return flattened list
  if (matchingProperties.length === 0) return [];
  return matchingProperties.reduce((a,b) => { return a.concat(b); });
};

module.exports = Plugins;
