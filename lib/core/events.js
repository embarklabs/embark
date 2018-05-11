const EventEmitter = require('events');
const inversify = require('inversify');
require('reflect-metadata');

class Events extends EventEmitter {

  warnIfLegacy(eventName) {
    const legacyEvents = ['abi-vanila', 'abi', 'abi-contracts-vanila', 'abi-vanila-deployment'];
    if (legacyEvents.indexOf(eventName) >= 0) {
      console.info("this event is deprecated and will be removed in future versions: " + eventName);
    }
  }

  log(eventType, eventName) {
    if (['end', 'prefinish', 'error', 'new', 'demo', 'block', 'version'].indexOf(eventName) >= 0) {
      return;
    }
    //console.log(eventType, eventName);
  }

  on(requestName, cb) {
    this.log("listening to event: ", requestName);
    this.warnIfLegacy(requestName);
    return super.on.call(this, requestName, cb);
  }

  setHandler(requestName, cb) {
    this.log("setting handler for: ", requestName);
    this.warnIfLegacy(requestName);
    return super.setHandler.call(this, requestName, cb);
  }
  request() {
    let requestName = arguments[0];
    let other_args = [].slice.call(arguments, 1);

    this.log("requesting: ", requestName);
    this.warnIfLegacy(requestName);
    return this.emit('request:' + requestName, ...other_args);
  }

  setCommandHandler(requestName, cb) {
    this.log("setting command handler for: ", requestName);
    return this.on('request:' + requestName, function (_cb) {
      cb.call(this, ...arguments);
    });
  }

  setCommandHandlerOnce(requestName, cb) {
    this.log("setting command handler for: ", requestName);
    return this.once('request:' + requestName, function (_cb) {
      cb.call(this, ...arguments);
    });
  }

}

inversify.decorate(inversify.injectable(), Events);
inversify.decorate(inversify.injectable(), EventEmitter);

module.exports = Events;
