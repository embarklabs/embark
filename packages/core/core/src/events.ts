import { __ } from 'embark-i18n';
const EventEmitter = require('events');
const cloneDeep = require('lodash.clonedeep');

const fs = require('fs-extra');

function debugEventsEnabled() {
  return process && process.env && process.env.DEBUGEVENTS;
}

function warnIfLegacy(eventName: string) {
  const legacyEvents: string[] = [];
  if (legacyEvents.indexOf(eventName) >= 0) {
    console.info(__("this event is deprecated and will be removed in future versions %s", eventName));
  }
}

function getOrigin() {
  if (!(debugEventsEnabled())) { return ""; }
  const stack = new Error().stack;
  if (stack) {
    let origin = stack.split("at ")[3].trim();
    origin = origin.split("(")[0].trim();
    return origin;
  }
  return '';
}

function log(eventType, eventName, origin?: string) {
  if (!(debugEventsEnabled())) { return; }
  if (['end', 'prefinish', 'error', 'new', 'demo', 'block', 'version'].indexOf(eventName) >= 0) {
    return;
  }
  if (eventName.indexOf("log") >= 0) {
    return;
  }
  // fs.appendFileSync(".embark/events.log", (new Error().stack) + "\n");
  if (!origin && origin !== "") {
    const stack = new Error().stack;
    if (stack) {
      origin = stack.split("at ")[3].trim();
      origin = origin.split("(")[0].trim();
    }
    // origin = getOrigin();
  }

  fs.ensureDirSync(".embark/");
  fs.appendFileSync(".embark/events.log", eventType + ": " + eventName + " -- (" + origin + ")\n");
}

// const cmdNames = {};
//
// function trackCmd(cmdName) {
//   if (!(process && process.env && process.env.DEBUGEVENTS)) return;
//   let origin = ((new Error().stack).split("at ")[3]).trim();
//   origin = origin.split("(")[0].trim();
//   cmdNames[cmdName] = origin;
// }

export class EmbarkEmitter extends EventEmitter {

  emit(requestName, ...args) {
    warnIfLegacy(arguments[0]);
    // log("\n|event", requestName);
    return super.emit(requestName, ...args);
  }
}

// EmbarkEmitter.prototype.log  = log;
EmbarkEmitter.prototype.log  = log;

EmbarkEmitter.prototype._maxListeners = 350;
const _on         = EmbarkEmitter.prototype.on;
const _once       = EmbarkEmitter.prototype.once;
const _setHandler = EmbarkEmitter.prototype.setHandler;
const _removeAllListeners = EmbarkEmitter.prototype.removeAllListeners;
const _emit       = EmbarkEmitter.prototype.emit;

const toFire = [];

EmbarkEmitter.prototype._emit = EmbarkEmitter.prototype.emit;

EmbarkEmitter.prototype.removeAllListeners = function(requestName) {
  delete toFire[requestName];
  return _removeAllListeners.call(this, requestName);
};

EmbarkEmitter.prototype.on = function(requestName, cb) {
  // log("EVENT LISTEN", requestName);
  warnIfLegacy(requestName);
  return _on.call(this, requestName, cb);
};

EmbarkEmitter.prototype.once = function(requestName, cb) {
  // log("EVENT LISTEN ONCE", requestName);
  warnIfLegacy(requestName);
  return _once.call(this, requestName, cb);
};

EmbarkEmitter.prototype.setHandler = function(requestName, cb) {
  log("SET HANDLER", requestName);
  warnIfLegacy(requestName);
  return _setHandler.call(this, requestName, cb);
};

EmbarkEmitter.prototype.request2 = function() {
  const requestName = arguments[0];
  const other_args: any[] = [].slice.call(arguments, 1);

  log("\nREQUEST", requestName);
  warnIfLegacy(requestName);
  if (this._events && !this._events['request:' + requestName]) {
    log("NO REQUEST LISTENER", requestName);

    if (debugEventsEnabled()) {
      console.log("made request without listener: " + requestName);
      console.trace();
    }
  }

  const promise = new Promise((resolve, reject) => {
    other_args.push(
      (err, ...res) => {
        if (err) { return reject(err); }
        if (res.length && res.length > 1) {
          return resolve(res);
        }
        return resolve(res[0]);
      }
    );

    this._emit('request:' + requestName, ...other_args);
  });

  const ogStack = (new Error().stack);

  promise.catch((e) => {
    if (debugEventsEnabled()) {
      console.dir(requestName);
      console.dir(ogStack);
    }
    log("\n======== Exception ========", requestName, "\n " + ogStack + "\n==============");
    return e;
  });

  return promise;
};

EmbarkEmitter.prototype.request = function() {
  const requestName = arguments[0];
  const other_args = [].slice.call(arguments, 1);

  log("\nREQUEST(OLD)", requestName);
  warnIfLegacy(requestName);
  if (this._events && !this._events['request:' + requestName]) {
    log("NO REQUEST LISTENER", requestName);
    if (debugEventsEnabled()) {
      console.log("made request without listener: " + requestName);
      console.trace();
    }
  }
  const listenerName = 'request:' + requestName;

  // TODO: remove this, it will lead to illusion of things working when this situatio shouldnt' hapepn in the first place

  // if we don't have a command handler set for this event yet,
  // store it and fire it once a command handler is set
  if (!this.listeners(listenerName).length) {
    if (!toFire[listenerName]) {
      toFire[listenerName] = [];
    }
    toFire[listenerName].push(other_args);
    return;
  }

  // return this.emit(listenerName, ...other_args);
  return this._emit(listenerName, ...other_args);
};

// TODO: ensure that it's only possible to create 1 command handler
EmbarkEmitter.prototype.setCommandHandler = function(requestName, cb) {
  log("SET COMMAND HANDLER", requestName);

  // let origin = ((new Error().stack).split("at ")[3]).trim();
  // origin = origin.split("(")[0].trim();
  const origin = getOrigin();

  const listener = function(_cb) {
    log("== REQUEST RESPONSE", requestName, origin);
    cb.call(this, ...arguments);
  };
  const listenerName = 'request:' + requestName;

  // unlike events, commands can only have 1 handler
  _removeAllListeners.call(this, listenerName);

  // TODO: remove this, it will lead to illusion of things working when this situatio shouldnt' hapepn in the first place
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

EmbarkEmitter.prototype.setCommandHandlerOnce = function(requestName, cb) {
  log("SET COMMAND HANDLER ONCE", requestName);

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
