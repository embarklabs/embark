var Plugin = require('./plugin.js');
var utils = require('../utils/utils.js');
const Events = require('./events');
const Logger = require('./logger');
const Config = require('./config');
const inversify = require('inversify');

require('reflect-metadata');

class Plugins{

  constructor(logger, events, config, context, interceptLogs){
    this.pluginList = config.embarkConfig.plugins || [];
    this.interceptLogs = interceptLogs;
    this.plugins = [];
  // TODO: need backup 'NullLogger'
    this.logger = logger;
    this.events = events;
    this.config = config;
    this.loadPlugins();
  }

  loadPlugins(){
    var pluginConfig;
    for (var pluginName in this.config.embarkConfig.plugins) {
      pluginConfig = this.pluginList[pluginName];
      this.loadPlugin(pluginName, pluginConfig);
    }
  }

  listPlugins() {
    const list = [];
    this.plugins.forEach(plugin => {
      if (plugin.loaded) {
        list.push(plugin.name);
      }
    });
    return list;
  }

  // for services that act as a plugin but have core functionality
  createPlugin(pluginName, pluginConfig) {
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
  }

  loadInternalPlugin(pluginName, pluginConfig) {
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
  }

  loadPlugin(pluginName, pluginConfig) {
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
  }

  getPluginsFor(pluginType) {
    return this.plugins.filter(function(plugin) {
      return plugin.has(pluginType);
    });
  }

  getPluginsProperty(pluginType, property) {
    let matchingPlugins = this.plugins.filter(function(plugin) {
      return plugin.has(pluginType);
    });

    let matchingProperties = matchingPlugins.map((plugin) => {
      return plugin[property];
    });

    //return flattened list
    if (matchingProperties.length === 0) return [];
    return matchingProperties.reduce((a,b) => { return a.concat(b); });
  }

}

inversify.decorate(inversify.injectable(), Plugins);
inversify.decorate(inversify.inject(Logger), Plugins, 0);
inversify.decorate(inversify.inject(Events), Plugins, 1);
inversify.decorate(inversify.inject(Config), Plugins, 2);
inversify.decorate(inversify.inject('context'), Plugins, 3);
inversify.decorate(inversify.inject('interceptLogs'), Plugins, 4);
inversify.decorate(inversify.optional(), Plugins, 4);

module.exports = Plugins;
