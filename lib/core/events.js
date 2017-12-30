var EventEmitter = require('events');

function warnIfLegacy(eventName) {
  const legacyEvents = ['abi-vanila', 'abi', 'abi-contracts-vanila', 'abi-vanila-deployment'];
  if (legacyEvents.indexOf(eventName) >= 0) {
    console.info("this event is deprecated and will be removed in future versions: " + eventName);
  }
}

function log(eventType, eventName) {
  if (['end', 'prefinish', 'error', 'new', 'demo', 'block', 'version'].indexOf(eventName) >= 0) {
    return;
  }
  //console.log(eventType, eventName);
}

const _on         = EventEmitter.prototype.on;
const _setHandler = EventEmitter.prototype.setHandler;

EventEmitter.prototype.on = function(requestName, cb) {
  log("listening to event: ", requestName);
  warnIfLegacy(requestName);
  return _on.call(this, requestName, cb);
};

EventEmitter.prototype.setHandler = function(requestName, cb) {
  log("setting handler for: ", requestName);
  warnIfLegacy(requestName);
  return _setHandler.call(this, requestName, cb);
};

EventEmitter.prototype.request = function() {
  let requestName = arguments[0];
  let other_args = [].slice.call(arguments, 1);

  log("requesting: ", requestName);
  warnIfLegacy(requestName);
  return this.emit('request:' + requestName, ...other_args);
};

EventEmitter.prototype.setCommandHandler = function(requestName, cb) {
  log("setting command handler for: ", requestName);
  return this.on('request:' + requestName, function(_cb) {
    cb.call(this, ...arguments);
  });
};

EventEmitter.prototype.setCommandHandlerOnce = function(requestName, cb) {
  log("setting command handler for: ", requestName);
  return this.once('request:' + requestName, function(_cb) {
    cb.call(this, ...arguments);
  });
};

module.exports = EventEmitter;
