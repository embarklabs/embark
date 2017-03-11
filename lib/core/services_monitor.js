var Web3 = require('web3');
var async = require('async');
var http = require('http');
var utils = require('./utils.js');

// TODO: repeated, add this to an async extensions file
function asyncEachObject(object, iterator, callback) {
  async.each(
    Object.keys(object || {}),
    function(key, next){
      iterator(key, object[key], next);
    },
    callback
  );
}
async.eachObject = asyncEachObject;

var ServicesMonitor = function(options) {
  this.events = options.events;
  this.logger = options.logger;
  this.checkList = {};
  this.checkTimers = {};
  this.checkState = {};
};

ServicesMonitor.prototype.addCheck = function(name, checkFn, time) {
  this.logger.info('add check: ' + name);
  // TODO: check if a service with the same name already exists
  this.checkList[name] = {fn: checkFn, interval: time || 5000};
};

ServicesMonitor.prototype.startMonitor = function() {
  this.logger.info('startMonitor');
  var self = this;

  async.eachObject(this.checkList, function(checkName, check, callback) {
    self.events.on('check:' + checkName, function(obj) {
      //self.logger.info('checked ' + checkName);
      //self.logger.info(JSON.stringify(obj));
      //self.logger.info(JSON.stringify(self.checkState));
      self.checkState[checkName] = obj.name[obj.status];
      self.events.emit("servicesState", self.checkState);
    });

    if (check.interval !== 0) {
      self.checkTimers[checkName] = setInterval(function() {
        check.fn.call(check.fn, function(obj) {
          self.events.emit('check:' + checkName, obj);
        });
      }, check.interval);
    }

    check.fn.call(check.fn, function(obj) {
      self.events.emit('check:' + checkName, obj);
    });
  }, function(err) {
  });
};

module.exports = ServicesMonitor;
