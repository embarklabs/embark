const sinon = require('sinon');
import fs from 'fs-extra';

class Embark {
  constructor(events, plugins, config) {
    this.events = events;
    this.plugins = plugins;
    this.config = config || {};
    this.assert = new EmbarkAssert(this);
    this.fs = fs;

    this.logger = {
      debug: sinon.fake(),
      info: sinon.fake(),
      warn: sinon.fake(),
      error: sinon.fake()
    };
  }

  registerActionForEvent(name, cb) {
    this.plugins.registerActionForEvent(name, cb);
  }

  registerConsoleCommand(options) {
    this.plugins.registerConsoleCommand(options);
  }

  teardown() {
    this.config = {};
    this.plugins.teardown();
  }

  setConfig(config) {
    this.config = config;
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
