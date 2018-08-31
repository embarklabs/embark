const RunCode = require('./runCode.js');

class CodeRunner {
  constructor(options) {
    this.config = options.config;
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.commands = [];
    this.runCode = new RunCode();
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
      let result = {web3Config: this.runCode.getWeb3Config(), commands: this.commands};
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
      cb(this.runCode.context);
    });
    this.events.setCommandHandler('runcode:eval', this.evalCode.bind(this));
  }

  registerVar(varName, code, toRecord = true) {
    if (this.ipc.isServer() && toRecord) {
      this.commands.push({varName, code});
      this.ipc.broadcast("runcode:newCommand", {varName, code});
    }
    this.runCode.registerVar(varName, code);
  }

  evalCode(code, cb, forConsoleOnly = false) {
    cb = cb || function() {};
    const awaitIdx = code.indexOf('await');
    if (awaitIdx > -1) {
      if (awaitIdx < 2) {
        let end = code.length;
        if (code[end - 1] === ';') {
          end--; // Remove the `;` because we add function calls
        }
        code = code.substring(5, end); // remove await keyword
      } else {
        code = `(async function() {${code}})();`;
      }
    }
    let result = this.runCode.doEval(code);

    if (forConsoleOnly && this.ipc.isServer()) {
      this.commands.push({code});
      this.ipc.broadcast("runcode:newCommand", {code});
    }

    if (result instanceof Promise) {
      return result.then((value) => cb(null, value)).catch(cb);
    }

    cb(null, result);
  }
}

module.exports = CodeRunner;
