const sinon = require('sinon');

class Embark {
  constructor(events, plugins) {
    this.events = events;
    this.plugins = plugins;

    this.assert = new EmbarkAssert(this);

    this.logger = {
      debug: sinon.fake(),
      info: sinon.fake(),
      warn: sinon.fake(),
      error: sinon.fake(),
    };
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
