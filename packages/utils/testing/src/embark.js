const sinon = require('sinon');
import fs from 'fs-extra';

class Embark {
  constructor(events, plugins, config = {}, ipc) {
    this.events = events;
    this.plugins = plugins;
    this.config = config || {};
    this.config.plugins = plugins;
    this.ipc = ipc;
    this.config.ipc = ipc;
    this.assert = new EmbarkAssert(this);
    this.fs = fs;

    this.logger = {
      debug: sinon.fake(),
      info: sinon.fake(),
      warn: sinon.fake(),
      error: sinon.fake(),
      trace: sinon.fake()
    };
  }

  registerAPICall(method, endpoint, callback) {
    this.plugins.registerAPICall(method, endpoint, callback);
  }

  registerActionForEvent(name, cb) {
    this.plugins.registerActionForEvent(name, cb);
  }

  registerConsoleCommand(options) {
    this.plugins.registerConsoleCommand(options);
  }

  teardown() {
    this.config = { plugins: this.plugins, ipc: this.ipc };
    this.plugins.teardown();
    this.ipc.teardown();
    this.events.teardown();
  }

  setConfig(config) {
    this.config = { ...config, plugins: this.plugins, ipc: this.ipc };
  }
}

class EmbarkAssert {
  constructor(embark) {
    this.embark = embark;
  }

  logged(level, message) {
    sinon.assert.calledWithMatch(this.embark.logger[level], message);
  }
}

module.exports = Embark;
