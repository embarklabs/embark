const ipc = require('node-ipc');
const {parse, stringify} = require('flatted/cjs');
const path = require('path');
const fs = require('fs-extra');
import { ipcPath } from 'embark-utils';

const EMBARK = 'embark';

export class IPC {
  constructor(options) {
    this.logger = options.logger;
    this.socketPath = options.socketPath || ipcPath('embark.ipc');
    this.ipcRole = options.ipcRole;
    ipc.config.silent = true;
    this.connected = false;
  }

  get client() {
    return ipc.of[EMBARK];
  }

  get server() {
    return ipc.server;
  }

  connect(done) {
    const connecting = (_socket) => {
      let connectedBefore = false, alreadyDisconnected = false;
      this.client.on('connect', () => {
        connectedBefore = true;
        if (!alreadyDisconnected) {
          this.connected = true;
          done();
        }
      });

      this.client.on('disconnect', () => {
        this.connected = false;
        this.disconnect();

        // we only want to trigger the error callback the first time
        if (!connectedBefore && !alreadyDisconnected) {
          alreadyDisconnected = true;
          done(new Error('no connection found'));
        }
      });
    };

    ipc.connectTo(EMBARK, this.socketPath, connecting);
  }

  disconnect() {
    ipc.disconnect(EMBARK);
  }

  serve() {
    fs.mkdirpSync(path.dirname(this.socketPath));
    ipc.serve(this.socketPath, () => {});
    this.server.start();

    this.logger.info(`pid ${process.pid} listening on ${this.socketPath}`);
  }

  on(action, raw, done) {
    let _raw = raw;
    let _done = done;
    if (typeof raw === 'function') {
      _raw = false;
      _done = raw;
    }
    if (_raw) return this.server.on(action, _done);
    this.server.on('message', (messageString, socket) => {
      const message = parse(messageString);
      if (message.action !== action) {
        return;
      }
      let reply = (error, replyData) => {
        this.reply(socket, action, error, replyData);
      };
      _done(message.data, reply, socket);
    });
  }

  reply(client, action, error, data) {
    const message = stringify({action, data, error: (error && error.stack)});
    this.server.emit(client, 'message', message);
  }

  listenTo(action, callback = () => {}) {
    if (!this.connected) {
      return callback();
    }
    this.client.on(action, (messageString) => {
      callback(parse(messageString));
    });
  }

  broadcast(action, data, raw = false) {
    this.server.broadcast(action, raw ? data: stringify(data));
  }

  once(action, cb = () => {}) {
    if (!this.connected) {
      return cb();
    }
    this.client.once('message', (messageString) => {
      const message = parse(messageString);
      if (message.action !== action) {
        return;
      }
      cb(message.error, message.data);
    });
  }

  request(action, data, cb) {
    if (!this.connected) {
      cb = cb || (() => {});
      return cb();
    }

    if (cb) {
      this.once(action, cb);
    }
    this.client.emit('message', stringify({action: action, data: data}));
  }

  isClient() {
    return this.ipcRole === 'client';
  }

  isServer() {
    return this.ipcRole === 'server';
  }

}
