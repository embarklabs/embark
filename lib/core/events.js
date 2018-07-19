var EventEmitter = require('events');

function warnIfLegacy(eventName) {
  const legacyEvents = [];
  if (legacyEvents.indexOf(eventName) >= 0) {
    console.info(__("this event is deprecated and will be removed in future versions %s", eventName));
  }
}

function log(eventType, eventName) {
  if (['end', 'prefinish', 'error', 'new', 'demo', 'block', 'version'].indexOf(eventName) >= 0) {
    return;
  }
  if (eventType.indexOf("log") >= 0) {
    return;
  }
  //console.log(eventType, eventName);
}

EventEmitter.prototype._maxListeners = 350;
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
  log("setting command handler for: " + requestName);
  let listener = function(_cb) {
    cb.call(this, ...arguments);
  };
  // unlike events, commands can only have 1 handler
  this.removeAllListeners('request:' + requestName);
  return this.on('request:' + requestName, listener);
};

EventEmitter.prototype.setCommandHandlerOnce = function(requestName, cb) {
  log("setting command handler for: ", requestName);
  return this.once('request:' + requestName, function(_cb) {
    cb.call(this, ...arguments);
  });
};

module.exports = EventEmitter;
