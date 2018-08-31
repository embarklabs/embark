let async = require('async');
let windowSize = require('window-size');

let Monitor = require('./monitor.js');

class Dashboard {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.env = options.env;

    this.events.on('firstDeploymentDone', this.checkWindowSize.bind(this));
    this.events.on('outputDone', this.checkWindowSize.bind(this));
  }

  checkWindowSize() {
    let size = windowSize.get();
    if (size.height < 40 || size.width < 118) {
      this.logger.warn(__("tip: you can resize the terminal or disable the dashboard with") + " embark run --nodashboard".bold.underline);
    }
  }

  start(done) {
    let monitor;

    monitor = new Monitor({env: this.env, events: this.events});
    this.logger.logFunction = monitor.logEntry;

    this.events.on('contractsState', monitor.setContracts);
    this.events.on('status', monitor.setStatus.bind(monitor));
    this.events.on('servicesState', monitor.availableServices.bind(monitor));

    this.events.setCommandHandler("console:command", monitor.executeCmd.bind(monitor));

    this.logger.info('========================'.bold.green);
    this.logger.info((__('Welcome to Embark') + ' ' + this.version).yellow.bold);
    this.logger.info('========================'.bold.green);

    done();
  }
}

module.exports = Dashboard;
