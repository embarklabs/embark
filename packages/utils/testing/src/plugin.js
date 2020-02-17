const assert = require('assert');
const sinon = require('sinon');

class Plugins {
  constructor() {
    this.plugin = new Plugin();
    this.plugins = [];
    this.assert = new PluginsAssert(this);
    this.mock = new PluginsMock(this);
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
      listeners.forEach(fn => fn.spy(options, callback));
    } else {
      callback(null, options);
    }
  }

  registerActionForEvent(name, cb) {
    this.plugin.registerActionForEvent(name, cb);
  }

  registerAPICall(method, endpoint, callback) {
    this.plugin.registerAPICall(method, endpoint, callback);
  }

  registerConsoleCommand(options) {
    this.plugin.registerConsoleCommand(options);
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
    this.apiCalls = {};
    this.pluginTypes = [];
    this.console = [];
    this.compilers = [];
  }

  getListeners(name) {
    return this.listeners[name];
  }

  registerActionForEvent(name, action) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }
    this.listeners[name].push({ raw: action, spy: sinon.spy(action) });
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

  registerAPICall(method, endpoint, callback) {
    const index = (method + endpoint).toLowerCase();
    this.apiCalls[index] = callback;
  }

  registerConsoleCommand(options) {
    this.console.push(options);
    this.addPluginType('console');
  }

  teardown() {
    this.compilers = [];
  }
}

class PluginsAssert {
  constructor(plugins) {
    this.plugins = plugins;
  }
  actionForEventRegistered(name, action) {
    assert(this.plugins.plugin.listeners[name] && this.plugins.plugin.listeners[name].some(registered => registered.raw === action), `action for ${name} wanted, but not registered`);
  }
  actionForEventCalled(name, action) {
    this.actionForEventRegistered(name, action);
    const registered = this.plugins.plugin.listeners[name].find(registered => registered.raw === action);
    sinon.assert.called(registered.spy);
  }

  actionForEventCalledWith(name, action, ...args) {
    this.actionForEventRegistered(name, action);
    const registered = this.plugins.plugin.listeners[name].find(registered => registered.raw === action);
    sinon.assert.calledWith(registered.spy, ...args);
  }

  apiCallRegistered(method, endpoint) {
    const index = (method + endpoint).toLowerCase();
    assert(this.plugins.plugin.apiCalls[index], `API call for '${method} ${endpoint}' wanted, but not registered`);
  }
}

class PluginsMock {
  constructor(plugins) {
    this.plugins = plugins;
  }

  apiCall(method, endpoint, params) {
    const index = (method + endpoint).toLowerCase();
    const apiFn = this.plugins.plugin.apiCalls[index];
    assert(apiFn, `API call for '${method} ${endpoint}' wanted, but not registered`);

    let req;
    if (["GET", "DELETE"].includes(method.toUpperCase())) {
      req = {
        query: params
      };
    } else {
      req = {
        body: params
      };
    }
    const resp = {
      send: sinon.spy(),
      status: sinon.spy()
    };
    apiFn(req, resp);
    return resp;
  }
}

module.exports = Plugins;

