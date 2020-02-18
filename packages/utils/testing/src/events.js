const assert = require('assert');
const sinon = require('sinon');

class Events {
  constructor() {
    this.commandHandlers = {};
    this.handlers = {};
    this.emissions = {};

    this.assert = new EventsAssert(this);
  }

  setCommandHandler(cmd, fn) {
    this.commandHandlers[cmd] = sinon.spy(fn);
  }

  on(ev, cb) {
    if (!this.handlers[ev]) {
      this.handlers[ev] = [];
    }

    this.handlers[ev].push(sinon.spy(cb));
  }

  emit(ev, ...args) {

    this.emissions[ev] = args;

    if (!this.handlers[ev]) {
      return;
    }

    this.handlers[ev].forEach(h => h(...args));
  }

  request(cmd, ...args) {
    assert(this.commandHandlers[cmd], `command handler for '${cmd}' not registered`);
    Promise.resolve(this.commandHandlers[cmd](...args));
  }

  request2(cmd, ...args) {
    assert(this.commandHandlers[cmd], `command handler for '${cmd}' not registered`);
    return new Promise((resolve, reject) => {
      args.push((err, ...res) => {
        if (err) {
          return reject(err);
        }
        if (res.length && res.length > 1) {
          return resolve(res);
        }
        return resolve(res[0]);
      });
      this.commandHandlers[cmd](...args);
    });
  }

  teardown() {
    this.commandHandlers = {};
    this.handlers = {};
    this.emissions = {};
  }
}

class EventsAssert {
  constructor(events) {
    this.events = events;
  }

  commandHandlerRegistered(cmd) {
    assert(this.events.commandHandlers[cmd], `command handler for '${cmd}' wanted, but not registered`);
  }

  commandHandlerCalled(cmd) {
    this.commandHandlerRegistered(cmd);
    sinon.assert.called(this.events.commandHandlers[cmd]);
  }

  commandHandlerNotCalled(cmd) {
    this.commandHandlerRegistered(cmd);
    assert(!this.events.commandHandlers[cmd].called);
  }

  commandHandlerCalledWith(cmd, ...args) {
    this.commandHandlerRegistered(cmd);
    sinon.assert.calledWith(this.events.commandHandlers[cmd], ...args);
  }

  listenerRegistered(name) {
    assert(this.events.handlers[name], `event listener for '${name}' wanted, but not registered`);
  }

  emitted(name) {
    assert(this.events.emissions[name]);
  }

  notEmitted(name) {
    assert(!Object.keys(this.events.emissions).includes(name));
  }

  emittedWith(name, ...args) {
    assert.equal(this.events.emissions[name], ...args);
  }

}

module.exports = Events;
