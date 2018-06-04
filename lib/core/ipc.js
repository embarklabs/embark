let fs = require('./fs.js');
let ipc = require('node-ipc');

class IPC {

  constructor(options) {
    this.logger = options.logger;
    this.socketPath = options.socketPath || fs.dappPath(".embark/embark.ipc");
    ipc.config.silent = true;
  }

  connect(done) {
    function connecting(socket) {
      ipc.of['embark'].on('connect',function() {
        done();
      });
    }

    ipc.connectTo('embark', this.socketPath, connecting);
  }

  serve() {
    ipc.serve(this.socketPath, () => {})
    ipc.server.start()

    this.logger.info(`pid ${process.pid} listening on ${this.socketPath}`);
  }

  on(action, done) {
    const self = this;
    ipc.server.on('message', function(data, socket) {
      if (data.action !== action) {
        return;
      }
      let reply = function(replyData) {
        self.reply(socket, 'compile', replyData);
      }
      done(data.message, reply, socket);
    });
  }

  reply(client, action, data) {
    ipc.server.emit(client, 'message', {action: action, message: data});
  }

  once(action, cb) {
    ipc.of['embark'].once('message', function(msg) {
      if (msg.action !== action) {
        return;
      }
      cb(msg.message);
    });
  }

  request(action, data, cb) {
    if (cb) {
      this.once(action, cb);
    }
    ipc.of['embark'].emit('message', {action: action, message: data});
  }

}

module.exports = IPC;
