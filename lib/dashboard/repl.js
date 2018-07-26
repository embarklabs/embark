const repl = require("repl");

const Console = require('./console.js');

class REPL {
  constructor(options) {
    this.env = options.env;
    this.plugins = options.plugins;
    this.events = options.events;
    this.console = new Console({
      events: this.events,
      plugins: this.plugins,
      version: options.version
    });
  }

  enhancedEval(cmd, context, filename, callback) {
    this.console.executeCmd(cmd.trim(), (result) => {
      callback(null, result);
    });
  }

  start(done) {
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > ",
      useGlobal: true,
      eval: this.enhancedEval.bind(this)
    });

    this.replServer.on("exit", () => {
      process.exit();
    });

    done();
  }

}

module.exports = REPL;
