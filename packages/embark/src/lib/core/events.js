var EventEmitter = require('events');
const cloneDeep = require('lodash.clonedeep');

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
}

EventEmitter.prototype._maxListeners = 350;
const _on         = EventEmitter.prototype.on;
const _once       = EventEmitter.prototype.once;
const _setHandler = EventEmitter.prototype.setHandler;
const _removeAllListeners = EventEmitter.prototype.removeAllListeners;

const toFire = [];

EventEmitter.prototype.removeAllListeners = function(requestName) {
  delete toFire[requestName];
  return _removeAllListeners.call(this, requestName);
};

EventEmitter.prototype.on = function(requestName, cb) {
  log("listening to event: ", requestName);
  warnIfLegacy(requestName);
  return _on.call(this, requestName, cb);
};

EventEmitter.prototype.once = function(requestName, cb) {
  log("listening to event (once): ", requestName);
  warnIfLegacy(requestName);
  return _once.call(this, requestName, cb);
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
  const listenerName = 'request:' + requestName;

  // if we don't have a command handler set for this event yet,
  // store it and fire it once a command handler is set
  if (!this.listeners(listenerName).length) {
    if(!toFire[listenerName]) {
      toFire[listenerName] = [];
    }
    toFire[listenerName].push(other_args);
    return;
  }

  return this.emit(listenerName, ...other_args);
};

EventEmitter.prototype.setCommandHandler = function(requestName, cb) {
  log("setting command handler for: " + requestName);
  let listener = function(_cb) {
    cb.call(this, ...arguments);
  };
  const listenerName = 'request:' + requestName;

  // unlike events, commands can only have 1 handler
  _removeAllListeners.call(this, listenerName);

  // if this event was requested prior to the command handler
  // being set up,
  // 1. delete the premature request(s) from the toFire array so they are not fired again
  // 2. Add an event listener for future requests
  // 3. call the premature request(s) bound
  const prematureListenerArgs = cloneDeep(toFire[listenerName]);
  if (prematureListenerArgs) {
    delete toFire[listenerName];
    // Assign listener here so that any requests bound inside the
    // initial listener callback will be bound (see unit tests for an example)
    this.on(listenerName, listener);
    prematureListenerArgs.forEach((prematureArgs) => {
      cb.call(this, ...prematureArgs);
    });
    return;
  }
  return this.on(listenerName, listener);
};

EventEmitter.prototype.setCommandHandlerOnce = function(requestName, cb) {
  log("setting command handler for: ", requestName);

  const listenerName = 'request:' + requestName;

  // if this event was requested prior to the command handler
  // being set up,
  // 1. delete the premature request(s) from the toFire array so they are not fired again
  // 2. call the premature request(s) bound
  // Do not bind an event listener for future requests as this is meant to be fired
  // only once.
  const prematureListenerArgs = cloneDeep(toFire[listenerName]);
  if (prematureListenerArgs) {
    delete toFire[listenerName];
    prematureListenerArgs.forEach((prematureArgs) => {
      cb.call(this, ...prematureArgs);
    });
    return;
  }

  return this.once(listenerName, function(_cb) {
    cb.call(this, ...arguments);
  });
};

module.exports = EventEmitter;
