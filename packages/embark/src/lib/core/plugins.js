import { dappPath, embarkPath } from 'embark-utils';
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
  this.fs = fs;
  this.env = options.env;
  this.version = options.version;
};

Plugins.deprecated = {
  'embarkjs-connector-web3': '4.1.0'
};

Plugins.prototype.loadPlugins = function() {
  Object.entries(Plugins.deprecated).forEach(([pluginName, embarkVersion]) => {
    if (this.pluginList[pluginName]) {
      delete this.pluginList[pluginName];
      this.logger.warn(`${pluginName} plugin was not loaded because it has been deprecated as of embark v${embarkVersion}, please remove it from this project's embark.json and package.json`);
    }
  });
  Object.entries(this.pluginList).forEach(([pluginName, pluginConfig]) => {
    this.loadPlugin(pluginName, pluginConfig);
  });
};

Plugins.prototype.listPlugins = function() {
  return this.plugins.reduce((list, plugin) => {
    if (plugin.loaded) {
      list.push(plugin.name);
    }
    return list;
  }, []);
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
    plugins: this.plugins,
    fs: this.fs,
    isInternal: true,
    context: this.context
  });
  this.plugins.push(pluginWrapper);
  return pluginWrapper;
};

Plugins.prototype.loadInternalPlugin = function(pluginName, pluginConfig, isPackage) {
  let pluginPath, plugin;
  if (isPackage) {
    pluginPath = pluginName;
    plugin = require(pluginName);
  } else {
    pluginPath = embarkPath('dist/lib/modules/' + pluginName);
    plugin = require(pluginPath);
  }

  if (plugin.default) {
    plugin = plugin.default;
  }

  const pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig || {},
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    plugins: this.plugins,
    fs: this.fs,
    isInternal: true,
    context: this.context,
    env: this.env
  });
  const pluginInstance = pluginWrapper.loadInternalPlugin();
  this.plugins.push(pluginWrapper);
  return pluginInstance;
};

Plugins.prototype.loadPlugin = function(pluginName, pluginConfig) {
  let pluginPath = dappPath('node_modules', pluginName);
  let plugin = require(pluginPath);

  if (plugin.default) {
    plugin = plugin.default;
  }

  var pluginWrapper = new Plugin({
    name: pluginName,
    pluginModule: plugin,
    pluginConfig: pluginConfig,
    logger: this.logger,
    pluginPath: pluginPath,
    interceptLogs: this.interceptLogs,
    events: this.events,
    config: this.config,
    plugins: this.plugins,
    fs: this.fs,
    isInternal: false,
    context: this.context,
    version: this.version
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
      plugin.call(plugin, (...params) => {
        nextEach(...params || current_args);
      });
    } else {
      plugin.call(plugin, args, (...params) => {
        nextEach(...params || current_args);
      });
    }
  }, cb);
};

Plugins.prototype.emitAndRunActionsForEvent = function(eventName, args, cb) {
  this.events.emit(eventName);
  return this.runActionsForEvent(eventName, args, cb);
};

module.exports = Plugins;
