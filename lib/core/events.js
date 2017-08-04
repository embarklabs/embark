var EventEmitter = require('events');

function warnIfLegacy(eventName) {
  const legacyEvents = ['abi-vanila', 'abi', 'abi-contracts-vanila', 'abi-vanila-deployment'];
  if (legacyEvents.indexOf(eventName) >= 0) {
    console.warn("this event is deprecated and will be removed in future versions: " + eventName);
  }
}

const _on         = EventEmitter.prototype.on;
const _setHandler = EventEmitter.prototype.setHandler;

EventEmitter.prototype.on = function(requestName, cb) {
  warnIfLegacy(requestName);
  return _on.call(this, requestName, cb);
};

EventEmitter.prototype.setHandler = function(requestName, cb) {
  warnIfLegacy(requestName);
  return _setHandler.call(this, requestName, cb);
};

EventEmitter.prototype.request = function(requestName, cb) {
  warnIfLegacy(requestName);
  return this.emit('request:' + requestName, cb);
};

EventEmitter.prototype.setCommandHandler = function(requestName, cb) {
  return this.on('request:' + requestName, function(_cb) {
    cb.call(this, _cb);
  });
};

module.exports = EventEmitter;
