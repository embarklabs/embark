const repl = require("repl");
const util = require("util");

const Console = require('./console.js');

class REPL {
  constructor(options) {
    this.logger = options.logger;
    this.env = options.env;
    this.plugins = options.plugins;
    this.events = options.events;
    this.version = options.version;
    this.ipc = options.ipc;
    this.config = options.config;
  }

  startConsole(){
    this.console = new Console({
      events: this.events,
      plugins: this.plugins,
      version: this.version,
      ipc: this.ipc,
      logger: this.logger,
      config: this.config
    });
  }

  enhancedEval(cmd, context, filename, callback) {
    this.console.executeCmd(cmd.trim(), callback);
  }

  enhancedWriter(output) {
    if ((typeof output) === "string") {
      return output;
    } else {
      return util.inspect(output, {colors: true});
    }
  }

  start(done) {
    this.startConsole();
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > ",
      useGlobal: true,
      eval: this.enhancedEval.bind(this),
      writer: this.enhancedWriter.bind(this)
    });

    this.events.request("runcode:getContext", (context) => {
      this.replServer.context = context;
    });

    this.replServer.on("exit", () => {
      process.exit();
    });

    done();
  }

}

module.exports = REPL;
