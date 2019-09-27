class Plugins {
  constructor() {
    this.plugin = new Plugin();
  }

  createPlugin() {
    return this.plugin;
  }

  emitAndRunActionsForEvent(name, options, callback) {
    const listeners = this.plugin.getListeners(name);
    if (listeners) {
      listeners.forEach(fn => fn(options, callback));
    }
  }

  registerActionForEvent(name, cb) {
    this.plugin.registerActionForEvent(name, cb);
  }

  teardown() {
    this.plugin.listeners = {};
  }
}

class Plugin {
  constructor() {
    this.listeners = {};
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
}

module.exports = Plugins;

