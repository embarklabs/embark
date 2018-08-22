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
      const awaitIdx = code.indexOf('await');
      if (awaitIdx > -1) {
        let end = code.length;
        if (code[end - 1] === ';') {
          end--; // Remove the `;` because we add function calls
        }
        if (awaitIdx < 2) {
          code = code.substring(5, end); // remove await keyword
          code += '.then(console.log).catch(console.error);'; // Add promise catch
        } else {
          code = code.substring(0, end); // remove ending `;`
          code = `(async function() {${code}.then(console.log);})();`;
        }
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
