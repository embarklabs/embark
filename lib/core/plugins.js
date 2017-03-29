const _ = require('underscore');
const EventEmitter = require('events').EventEmitter;

let Plugins = function (options) {
  //TODO: put an observer on this.plugins and call loadPlugin when a new item is added
  this.config = {};
  for (let opt in options) {
    if (options.hasOwnProperty(opt)) {
      this.config[opt] = options[opt];
    }
  }

  let requiredOptions = ['interceptLogs', 'plugins', 'logger'];
  for (let i = 0; requiredOptions.length > i; i++) {
    if (!(_.contains(Object.keys(this.config), requiredOptions[i]))) {
      console.log('Warning: missing required plugin configuration key: ' + requiredOptions[i]);
    }
  }
  this.on('load', () => {
    this.load();
  });

  this.on('get', (pluginType, cb) => {
    let pluginTypes = getPluginsFor(pluginType, this.config.plugins);
    return cb(pluginTypes);
  });

};

Plugins.prototype.load = Plugins.prototype.loadPlugins = function () {
  let pluginConfig;
  for (let i = 0; this.config.plugins.length > i; i++) {
    pluginConfig = this.config.plugins[i].config;
    let Plugin = require('./plugin');
    let plugin = new Plugin(pluginConfig);
    plugin.run();
  }
};

Plugins.prototype.listPlugins = function () {
  return this.config.plugins.join(', ');
};

let getPluginsFor = function (pluginType, plugins) {
  return _.filter(plugins, pluginType);
};

Plugins.prototype.getPluginsFor = getPluginsFor;

Plugins.prototype = Object.create(EventEmitter.prototype);

module.exports = Plugins;