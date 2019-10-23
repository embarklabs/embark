class Plugins {
  constructor() {
    this.plugin = new Plugin();
    this.plugins = [];
  }

  createPlugin(name) {
    let plugin = new Plugin({ name });
    this.plugins.push(plugin);
    return plugin;
  }

  emitAndRunActionsForEvent(name, options, callback) {
    this.runActionsForEvent(name, options, callback);
  }

  runActionsForEvent(name, options, callback) {
    const listeners = this.plugin.getListeners(name);
    if (listeners) {
      listeners.forEach(fn => fn(options, callback));
    } else {
      callback(null, options);
    }
  }

  registerActionForEvent(name, cb) {
    this.plugin.registerActionForEvent(name, cb);
  }

  teardown() {
    this.plugin.listeners = {};
    this.plugins.forEach(plugin => plugin.teardown());
  }

  getPluginsProperty(pluginType, prop, childProp) {
    let plugins = this.plugins.filter(plugin => plugin.has(pluginType));

    let properties = plugins.map(plugin => {
      if (childProp) {
        return plugin[prop][childProp];
      }
      return plugin[prop];
    });
    return properties.length > 0 ? properties.reduce((a,b) => { return a.concat(b); }) || [] : [];
  }
}

class Plugin {
  constructor() {
    this.listeners = {};
    this.pluginTypes = [];
    this.compilers = [];
  }

  getListeners(name) {
    return this.listeners[name];
  }

  registerActionForEvent(name, action) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(action);
  }

  has(pluginType) {
    return this.pluginTypes.indexOf(pluginType) >= 0;
  }

  addPluginType(pluginType) {
    this.pluginTypes.push(pluginType);
    this.pluginTypes = Array.from(new Set(this.pluginTypes));
  }

  registerCompiler(extension, cb) {
    this.compilers.push({extension: extension, cb: cb});
    this.addPluginType('compilers');
  }

  teardown() {
    this.compilers = [];
  }
}

module.exports = Plugins;

