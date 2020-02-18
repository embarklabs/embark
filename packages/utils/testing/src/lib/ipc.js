const assert = require('assert');
const sinon = require('sinon');

class Ipc {
  constructor(isServer = true) {
    this._isServer = isServer;
    this.handlers = {};
    this.assert = new IpcAssert(this);
    this._client = null;
    this.broadcasts = {};
  }

  get connected() {
    return true;
  }

  get client() {
    if (this._client !== null) {
      return this._client;
    }
    this._client = new Ipc(false);
    return this._client;
  }

  broadcast(ev, ...args) {
    this.broadcasts[ev] = args;
  }

  isClient() {
    return !this._isServer;
  }

  isServer() {
    return this._isServer;
  }

  on(ev, cb) {
    if (!this.handlers[ev]) {
      this.handlers[ev] = [];
    }

    this.handlers[ev].push(cb);
  }

  request(ev, ...args) {
    if (!this.handlers[ev]) {
      return;
    }

    this.handlers[ev].forEach(h => h(...args));
  }

  teardown() {
    this.handlers = {};
    this._client = null;
    this.broadcasts = {};
  }
}

class IpcAssert {
  constructor(ipc) {
    this.ipc = ipc;
  }

  listenerRegistered(cmd) {
    assert(this.ipc.handlers[cmd], `listener for '${cmd}' wanted, but not registered`);
  }
  
  listenerNotRegistered(cmd) {
    assert(!Object.keys(this.ipc.handlers).some(command => command === cmd), `listener for '${cmd}' registered, but expected to not be registered`);
  }
  
  listenerRequested(cmd) {
    this.listenerRegistered(cmd);
    sinon.assert.called(this.events.handlers[cmd]);
  }

  listenerRequestedWith(cmd, ...args) {
    this.listenerRequested(cmd);
    sinon.assert.calledWith(this.events.handlers[cmd], ...args);
  }

}

module.exports = Ipc;
