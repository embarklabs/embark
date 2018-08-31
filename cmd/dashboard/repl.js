const repl = require("repl");
const util = require("util");
class REPL {
  constructor(options) {
    this.events = options.events;
    this.env = options.env
  }

  enhancedEval(cmd, context, filename, callback) {
    this.events.request('console:executeCmd', cmd.trim(), callback);
  }

  enhancedWriter(output) {
    if ((typeof output) === "string") {
      return output;
    } else {
      return util.inspect(output, {colors: true});
    }
  }

  start(done) {
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
