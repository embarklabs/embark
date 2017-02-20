var async = require('async');

var Monitor = require('./monitor.js');
var Console = require('./console.js');

var Dashboard = function(options) {
  this.logger = options.logger;
  this.plugins = options.plugins;
  this.version = options.version;
  this.env = options.env;
};

Dashboard.prototype.start = function(done) {
  var console, monitor;
  var self = this;

  async.waterfall([
    function startConsole(callback) {
      console = new Console({plugins: self.plugins, version: self.version});
      callback();
    },
    function startMonitor(callback) {
      monitor = new Monitor({env: self.env, console: console});
      self.logger.logFunction = monitor.logEntry;
      self.logger.contractsState = monitor.setContracts;
      self.logger.availableServices = monitor.availableServices;
      self.logger.setStatus = monitor.setStatus.bind(monitor);

      self.logger.info('========================'.bold.green);
      self.logger.info(('Welcome to Embark ' + self.version).yellow.bold);
      self.logger.info('========================'.bold.green);

      // TODO: do this after monitor is rendered
      callback();
    }
  ], function() {
    self.console = console;
    self.monitor = monitor;
    done();
  });
};

module.exports = Dashboard;
