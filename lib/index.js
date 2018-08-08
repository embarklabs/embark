let version = require('../package.json').version;

class Embark {

  constructor(options) {
    this.version = version;
    this.options = options || {};
  }

  initConfig(env, options) {
    let Events = require('./core/events.js');
    let Logger = require('./core/logger.js');
    let Config = require('./core/config.js');

    this.events = new Events();
    this.logger = new Logger({logLevel: 'debug', events: this.events});

    this.config = new Config({env: env, logger: this.logger, events: this.events, context: this.context});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }
}

module.exports = Embark;
