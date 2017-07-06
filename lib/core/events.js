var EventEmitter = require('events');

EventEmitter.prototype.request = function(requestName, cb) {
  this.emit('request:' + requestName, cb);
};

EventEmitter.prototype.setCommandHandler = function(requestName, cb) {
  this.on('request:' + requestName, function(_cb) {
    cb.call(this, _cb);
  });
};

module.exports = EventEmitter;
