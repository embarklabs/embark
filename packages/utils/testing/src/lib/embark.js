const sinon = require('sinon');

class Embark {
  constructor(events, plugins) {
    this.events = events;
    this.plugins = plugins;
    this.config = {
      blockchainConfig: {}
    };

    this.assert = new EmbarkAssert(this);

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

  teardown() {
    this.plugins.teardown();
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
