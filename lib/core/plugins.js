const async = require('async');
var Plugin = require('./plugin.js');
var fs = require('../core/fs.js');

var Plugins = function(options) {
  this.pluginList = options.plugins || [];
  this.interceptLogs = options.interceptLogs;
  this.plugins = [];
  // TODO: need backup 'NullLogger'
  this.logger = options.logger;
  this.events = options.events;
  this.config = options.config;
  this.context = options.context;
  this.env = options.env;
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
    //plugins: this,
    isInternal: true,
    context: this.context
  });
  this.plugins.push(pluginWrapper);
  return pluginWrapper;
};

Plugins.prototype.loadInternalPlugin = function(pluginName, pluginConfig) {
  var pluginPath = fs.embarkPath('lib/modules/' + pluginName);
  var plugin = require(pluginPath);

  var pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig || {},
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    //plugins: this.plugins,
    isInternal: true,
    context: this.context,
    env: this.env
  });
  pluginWrapper.loadInternalPlugin();
  this.plugins.push(pluginWrapper);
};

Plugins.prototype.loadPlugin = function(pluginName, pluginConfig) {
  var pluginPath = fs.dappPath('node_modules', pluginName);
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

Plugins.prototype.getPluginsProperty = function(pluginType, property, sub_property) {
  let matchingPlugins = this.plugins.filter(function(plugin) {
    return plugin.has(pluginType);
  });

  // Sort internal plugins first
  matchingPlugins.sort((a, b) => {
    if (a.isInternal) {
      return -1;
    }
    if (b.isInternal) {
      return 1;
    }
    return 0;
  });

  let matchingProperties = matchingPlugins.map((plugin) => {
    if (sub_property) {
      return plugin[property][sub_property];
    }
    return plugin[property];
  });

  // Remove empty properties
  matchingProperties = matchingProperties.filter((property) => property);

  //return flattened list
  if (matchingProperties.length === 0) return [];
  return matchingProperties.reduce((a,b) => { return a.concat(b); }) || [];
};

Plugins.prototype.runActionsForEvent = function(eventName, args, cb) {
  if (typeof (args) === 'function') {
    cb = args;
  }
  let actionPlugins = this.getPluginsProperty('eventActions', 'eventActions', eventName);

  if (actionPlugins.length === 0) {
    return cb(args);
  }

  async.reduce(actionPlugins, args, function(current_args, plugin, nextEach) {
    if (typeof (args) === 'function') {
      plugin.call(plugin, (params) => {
        nextEach(null, (params || current_args));
      });
    } else {
      plugin.call(plugin, args, (params) => {
        nextEach(null, (params || current_args));
      });
    }
  }, cb);
};

Plugins.prototype.emitAndRunActionsForEvent = function(eventName, args, cb) {
  this.events.emit(eventName);
  return this.runActionsForEvent(eventName, args, cb);
};

module.exports = Plugins;
