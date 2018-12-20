const VM = require('./vm');
const fs = require('../../fs');

class CodeRunner {
  constructor(options) {
    this.config = options.config;
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.commands = [];
    this.vm = new VM({
      require: {
        mock: {
          fs: {
            access: fs.access,
            diagramPath: fs.diagramPath,
            dappPath: fs.dappPath,
            embarkPath: fs.embarkPath,
            existsSync: fs.existsSync,
            ipcPath: fs.ipcPath,
            pkgPath: fs.pkgPath,
            readFile: fs.readFile,
            readFileSync: fs.readFileSync,
            readJSONSync: fs.readJSONSync,
            readdir: fs.readdir,
            readdirSync: fs.readdirSync,
            stat: fs.stat,
            statSync: fs.statSync,
            tmpDir: fs.tmpDir
          }
        }
      }
    }, this.logger);
    this.registerIpcEvents();
    this.IpcClientListen();
    this.registerEvents();
    this.registerCommands();
  }

  registerIpcEvents() {
    if (!this.ipc.isServer()) {
      return;
    }

    this.ipc.on('runcode:getCommands', (_err, callback) => {
      let result = {web3Config: this.vm.getWeb3Config(), commands: this.commands};
      callback(null, result);
    });
  }

  IpcClientListen() {
    if (!this.ipc.isClient() || !this.ipc.connected) {
      return;
    }

    this.ipc.listenTo('runcode:newCommand', (command) => {
      if (command.varName) {
        this.events.emit("runcode:register", command.varName, command.code);
      } else {
        this.events.request("runcode:eval", command.code);
      }
    });
  }

  registerEvents() {
    this.events.on("runcode:register", this.registerVar.bind(this));
  }

  registerCommands() {
    this.events.setCommandHandler('runcode:getContext', (cb) => {
      cb(this.vm.options.sandbox);
    });
    this.events.setCommandHandler('runcode:eval', this.evalCode.bind(this));
  }

  registerVar(varName, code, toRecord = true) {
    if (this.ipc.isServer() && toRecord) {
      this.commands.push({varName, code});
      this.ipc.broadcast("runcode:newCommand", {varName, code});
    }
    this.vm.registerVar(varName, code);
  }

  async evalCode(code, cb, isNotUserInput = false, tolerateError = false) {
    cb = cb || function () {};

    if (!code) return cb(null, '');

    this.vm.doEval(code, tolerateError, (err, result) => {
      if(err) {
        return cb(err);
      }
      
      if (isNotUserInput && this.ipc.isServer()) {
        this.commands.push({code});
        this.ipc.broadcast("runcode:newCommand", {code});
      }
      
      cb(null, result);
    });
  }

}

module.exports = CodeRunner;
