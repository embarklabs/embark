// still needs to be run on a separate file due to the global context
var RunCode = require('./runCode.js');

class CodeRunner {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;

    // necessary to init the context
    RunCode.initContext();

    this.events.on("runcode:register", (varName, code) => {
      RunCode.registerVar(varName, code);
    });

    this.events.setCommandHandler('runcode:eval', (code, cb) => {
      if (!cb) {
        cb = function() {};
      }
      try {
        let result = RunCode.doEval(code);
        cb(null, result);
      } catch (e) {
        cb(e);
      }

    });
  }
}

module.exports = CodeRunner;
