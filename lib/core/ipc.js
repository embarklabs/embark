let fs = require('./fs.js');
let ipc = require('node-ipc');

class IPC {

  constructor(options) {
    this.logger = options.logger;
    this.socketPath = options.socketPath || fs.dappPath(".embark/embark.ipc");
    this.ipcRole = options.ipcRole || "server";
    ipc.config.silent = true;
    this.connected = false;
  }

  connect(done) {
    const self = this;
    function connecting(_socket) {
      let connectedBefore = false, alreadyDisconnected = false;
      ipc.of['embark'].on('connect',function() {
        connectedBefore = true;
        if (!alreadyDisconnected) {
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
    ipc.server.on('message', function(data, socket) {
      if (data.action !== action) {
        return;
      }
      let reply = function(error, replyData) {
        self.reply(socket, action, error, replyData);
      };
      done(data.message, reply, socket);
    });
  }

  reply(client, action, error, data) {
    ipc.server.emit(client, 'message', {action: action, message: data, error: (error && error.stack)});
  }

  listenTo(action, callback) {
    ipc.of['embark'].on(action, callback);
  }

  broadcast(action, data) {
    ipc.server.broadcast(action, data);
  }

  once(action, cb) {
    ipc.of['embark'].once('message', function(msg) {
      if (msg.action !== action) {
        return;
      }
      cb(msg.error, msg.message);
    });
  }

  request(action, data, cb) {
    if (cb) {
      this.once(action, cb);
    }
    ipc.of['embark'].emit('message', {action: action, message: data});
  }

  isClient() {
    return this.ipcRole === 'client';
  }

  isServer() {
    return this.ipcRole === 'server';
  }

}

module.exports = IPC;
