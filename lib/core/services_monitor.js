let async = require('../utils/async_extend.js');

class ServicesMonitor {
  constructor(options) {
    const self = this;
    this.events = options.events;
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.checkList = {};
    this.checkTimers = {};
    this.checkState = {};
    this.working = false;

    self.events.setCommandHandler("services:register", (checkName, checkFn, time, initialStatus) => {
      self.addCheck(checkName, checkFn, time, initialStatus);
    });
  }
}

ServicesMonitor.prototype.initCheck = function (checkName) {
  let self = this;
  let check = this.checkList[checkName];

  if (!check) {
    return false;
  }

  self.events.on('check:' + checkName, function (obj) {
    if (check && check.status === 'off' && obj.status === 'on') {
      self.events.emit('check:backOnline:' + checkName);
    }
    if (check && check.status === 'on' && obj.status === 'off') {
      self.events.emit('check:wentOffline:' + checkName);
    }
    self.checkState[checkName] = {name: obj.name, status: obj.status, serviceName: checkName};
    check.status = obj.status;
    self.events.emit("servicesState", self.checkState);
  });

  if (check.interval !== 0) {
    self.checkTimers[checkName] = setInterval(function () {
      check.fn.call(check.fn, function (obj) {
        self.events.emit('check:' + checkName, obj);
      });
    }, check.interval);
  }

  check.fn.call(check.fn, function (obj) {
    self.events.emit('check:' + checkName, obj);
  });
};

ServicesMonitor.prototype.addCheck = function (checkName, checkFn, time, initialState) {
  this.logger.trace('add check: ' + checkName);
  this.checkList[checkName] = {fn: checkFn, interval: time || 5000, status: initialState};

  if (this.working) {
    this.initCheck(checkName);
  }
};

ServicesMonitor.prototype.stopCheck = function (name) {
  clearInterval(this.checkTimers[name]);
  delete this.checkTimers[name];
  delete this.checkList[name];
  delete this.checkState[name];
};

ServicesMonitor.prototype.startMonitor = function () {
  let self = this;
  this.working = true;
  this.logger.trace('startMonitor');

  let servicePlugins = this.plugins.getPluginsProperty('serviceChecks', 'serviceChecks');
  servicePlugins.forEach(function (pluginCheck) {
    self.addCheck(pluginCheck.checkName, pluginCheck.checkFn, pluginCheck.time);
  });

  async.eachObject(this.checkList, function (checkName, check, callback) {
    self.initCheck(checkName);
    callback();
  }, function (err) {
    if (err) {
      self.logger.error(__("error running service check"));
      self.logger.error(err.message);
    }
  });
};

module.exports = ServicesMonitor;
