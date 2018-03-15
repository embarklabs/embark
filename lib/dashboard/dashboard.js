let async = require('async');

let Monitor = require('./monitor.js');
let Console = require('./console.js');

class Dashboard {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.env = options.env;
    this.contractsConfig = options.contractsConfig;
  }

  start(done) {
    let console, monitor;
    let self = this;

    async.waterfall([
      function startConsole(callback) {
        console = new Console({
          events: self.events,
          plugins: self.plugins,
          version: self.version,
          contractsConfig: self.contractsConfig
        });
        callback();
      },
      function startMonitor(callback) {
        monitor = new Monitor({env: self.env, console: console, events: self.events});
        self.logger.logFunction = monitor.logEntry;

        self.events.on('contractsState', monitor.setContracts);
        self.events.on('status', monitor.setStatus.bind(monitor));
        self.events.on('servicesState', monitor.availableServices.bind(monitor));

        self.events.setCommandHandler("console:command", monitor.executeCmd.bind(monitor));

        self.logger.info('========================'.bold.green);
        self.logger.info(('Welcome to Embark ' + self.version).yellow.bold);
        self.logger.info('========================'.bold.green);

        // TODO: do this after monitor is rendered
        callback();
      }
    ], function () {
      self.console = console;
      self.monitor = monitor;
      done();
    });
  }

}

module.exports = Dashboard;
