let __mainContext;

class CodeRunner {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
  }

  registerVar(varName, code) {
    __mainContext[varName] = code;
  }

  doEval(code) {
    try {
      // TODO: add trace log here
      return eval(code);
    } catch(e) {
      throw new Error(e + "\n" + code);
    }
  }
}

module.exports = CodeRunner;
