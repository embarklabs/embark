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
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

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
    this.plugin.teardown();
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
    this.listeners = {};
    this.apiCalls = {};
    this.pluginTypes = [];
    this.console = [];
    this.compilers = [];
  }
}

class PluginsAssert {
  constructor(plugins) {
    this.plugins = plugins;
  }
  actionForEventRegistered(name, _action) {
    assert(this.plugins.plugin.listeners[name], `action for ${name} wanted, but not registered`);
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
  
  consoleCommandRegistered(command) {
    const registered = this.plugins.plugin.console.some(cmd => {
      if (!cmd.matches) {
        return false;
      }
      if (Array.isArray(cmd.matches)) {
        return cmd.matches.some(matches => matches.includes(command));
      }
      if (typeof cmd.matches === 'function') {
        return cmd.matches(command);
      }
      return false;
    });
    assert(registered);
  }
}

class PluginsMock {
  constructor(plugins) {
    this.plugins = plugins;
  }

  consoleCommand(cmd) {
    const command = this.plugins.plugin.console.find(c => {
      if (!c.matches) {
        return;
      }
      if (Array.isArray(c.matches) && c.matches.some(matches => matches.includes(cmd))) {
        return c;
      }
      if (typeof c.matches === 'function' && c.matches(cmd)) {
        return c;
      }
      return;
    });
    assert(command, `Console command for '${cmd}' wanted, but not registered`);
    const cb = sinon.fake();

    return new Promise((resolve, reject) => {
      command.process(cmd, (err, ...res) => {
        if (err) {
          return reject(err);
        }
        if (res.length && res.length > 1) {
          cb(res);
          return resolve(cb);
        }
        cb(res[0]);
        return resolve(cb);
      });
      resolve(cb);
    });
  }

  async apiCall(method, endpoint, params) {
    const index = (method + endpoint).toLowerCase();
    const apiFn = this.plugins.plugin.apiCalls[index];
    assert(apiFn, `API call for '${method} ${endpoint}' wanted, but not registered`);

    let req = {};
    if (["GET", "DELETE"].includes(method.toUpperCase())) {
      if (params && params.params) {
        req.params = params.params;
      }
      req.query = params;
    } else {
      req = {
        body: params
      };
    }
    const resp = {
      send: sinon.spy()
    };

    resp.status = sinon.fake.returns(resp);
    await apiFn(req, resp);
    return resp;
  }
}

module.exports = Plugins;

