const assert = require('assert');
const sinon = require('sinon');

class Events {
  constructor() {
    this.commandHandlers = {};
    this.handlers = {};

    this.assert = new EventsAssert(this);
  }

  setCommandHandler(cmd, fn) {
    this.commandHandlers[cmd] = sinon.spy(fn);
  }

  on(ev, cb) {
    if (!this.handlers[ev]) {
      this.handlers[ev] = [];
    }

    this.handlers[ev].push(cb);
  }

  emit() {

  }

  trigger(ev, ...args) {
    if (!this.handlers[ev]) {
      return;
    }

    this.handlers[ev].forEach(h => h(...args));
  }

  request(cmd, ...args) {
    assert(this.commandHandlers[cmd], `command handler for ${ cmd } not registered`);
    Promise.resolve(this.commandHandlers[cmd](...args));
  }

  request2(cmd, ...args) {
    assert(this.commandHandlers[cmd], `command handler for ${ cmd } not registered`);
    this.commandHandlers[cmd](...args);
  }
}

class EventsAssert {
  constructor(events) {
    this.events = events;
  }

  commandHandlerRegistered(cmd) {
    assert(this.events.commandHandlers[cmd], `command handler for ${ cmd } wanted, but not registered`);
  }

  commandHandlerCalled(cmd) {
    this.commandHandlerRegistered(cmd);
    sinon.assert.called(this.events.commandHandlers[cmd]);
  }

  commandHandlerCalledWith(cmd, ...args) {
    this.commandHandlerRegistered(cmd);
    sinon.assert.calledWith(this.events.commandHandlers[cmd], ...args);
  }

}

module.exports = Events;
