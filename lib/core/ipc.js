const fs = require('./fs.js');
const ipc = require('node-ipc');
const {parse, stringify} = require('flatted/cjs');

class IPC {

  constructor(options) {
    this.logger = options.logger;
    this.socketPath = options.socketPath || fs.dappPath(".embark/embark.ipc");
    this.ipcRole = options.ipcRole;
    ipc.config.silent = true;
    this.connected = false;
  }

  connect(done) {
    const self = this;
    function connecting(_socket) {
      let connectedBefore = false, alreadyDisconnected = false;
      ipc.of['embark'].on('connect',function() {
        if (!alreadyDisconnected && !connectedBefore) {
        connectedBefore = true;
          self.connected = true;
          done();
        }
      });
      ipc.of['embark'].on('disconnect',function() {
        self.connected = false;
        ipc.disconnect('embark');

        // we only want to trigger the error callback the first time
        if (!connectedBefore && !alreadyDisconnected) {
          alreadyDisconnected = true;
          done(new Error("no connection found"));
        }
      });
    }

    ipc.connectTo('embark', this.socketPath, connecting);
  }

  serve() {
    fs.mkdirpSync(fs.dappPath(".embark"));
    ipc.serve(this.socketPath, () => {});
    ipc.server.start();

    this.logger.info(`pid ${process.pid} listening on ${this.socketPath}`);
  }

  on(action, done) {
    const self = this;
    ipc.server.on('message', function(messageString, socket) {
      const message = parse(messageString);
      if (message.action !== action) {
        return;
      }
      let reply = function(error, replyData) {
        self.reply(socket, action, error, replyData);
      };
      done(message.data, reply, socket);
    });
  }

  reply(client, action, error, data) {
    const message = stringify({action, data, error: (error && error.stack)});
    ipc.server.emit(client, 'message', message);
  }

  listenTo(action, callback) {
    ipc.of['embark'].on(action, (messageString) => {
      callback(parse(messageString));
    });
  }

  broadcast(action, data) {
    ipc.server.broadcast(action, stringify(data));
  }

  once(action, cb) {
    ipc.of['embark'].once('message', function(messageString) {
      const message = parse(messageString);
      if (message.action !== action) {
        return;
      }
      cb(message.error, message.data);
    });
  }

  request(action, data, cb) {
    if (cb) {
      this.once(action, cb);
    }
    ipc.of['embark'].emit('message', stringify({action: action, data: data}));
  }

  isClient() {
    return this.ipcRole === 'client';
  }

  isServer() {
    return this.ipcRole === 'server';
  }

}

module.exports = IPC;
