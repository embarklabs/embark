let async = require('async');

let Monitor = require('./monitor.js');
let Console = require('./console.js');

class Dashboard {
  constructor(options) {
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.version = options.version;
    this.env = options.env;
  }

  start(done) {
    let console, monitor;
    let self = this;

    async.waterfall([
      function startConsole(callback) {
        console = new Console({plugins: self.plugins, version: self.version});
        callback();
      },
      function startMonitor(callback) {
        monitor = new Monitor({env: self.env, console: console});
        self.logger.logFunction = monitor.logEntry;
        self.logger.contractsState = monitor.setContracts;
        self.logger.setStatus = monitor.setStatus.bind(monitor);

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
