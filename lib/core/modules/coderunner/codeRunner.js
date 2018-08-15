// still needs to be run on a separate file due to the global context
var RunCode = require('./runCode.js');

class CodeRunner {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.commands = [];
    let self = this;
    // necessary to init the context
    RunCode.initContext();

    if (this.ipc.isServer()) {
      this.ipc.on('runcode:getCommands', (_err, callback) => {
        let result = {web3Config: RunCode.getWeb3Config(), commands: self.commands};
        callback(null, result);
      });
    }

    if (this.ipc.isClient() && this.ipc.connected) {
      this.ipc.listenTo('runcode:newCommand', function (command) {
        if (command.varName) {
          self.events.emit("runcode:register", command.varName, command.code);
        } else {
          self.events.request("runcode:eval", command.code);
        }
      });
    }

    this.events.on("runcode:register", (varName, code) => {
      if (self.ipc.isServer() && varName !== 'web3') {
        self.commands.push({varName, code});
        self.ipc.broadcast("runcode:newCommand", {varName, code});
      }
      RunCode.registerVar(varName, code);
    });

    this.events.setCommandHandler('runcode:eval', (code, cb, forConsoleOnly = false) => {
      if (!cb) {
        cb = function() {};
      }
      let result = RunCode.doEval(code);
      if (forConsoleOnly && self.ipc.isServer()) {
        self.commands.push({code});
        self.ipc.broadcast("runcode:newCommand", {code});
      }
      cb(null, result);
    });
  }

}

module.exports = CodeRunner;
