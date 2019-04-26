let version = require('../../package.json').version;
const Logger = require('embark-logger');

class Embark {

  constructor(options) {
    this.version = version;
    this.options = options || {};
  }

  initConfig(env, options) {
    let Events = require('./core/events.js');
    let Config = require('./core/config.js');

    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug', events: this.events, context: this.context});

    this.config = new Config({env: env, logger: this.logger, events: this.events, context: this.context, version: this.version});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }
}

module.exports = Embark;
