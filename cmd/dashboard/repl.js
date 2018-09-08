const repl = require("repl");
const util = require("util");

class REPL {
  constructor(options) {
    this.events = options.events;
    this.env = options.env;
    this.inputStream = options.inputStream || process.stdin;
    this.outputStream = options.outputStream || process.stdout;
  }

  enhancedEval(cmd, context, filename, callback) {
    this.events.request('console:executeCmd', cmd.trim(), function (err, message) {
      callback(err, message || ''); // This way, we don't print undefined
    });
  }

  enhancedWriter(output) {
    if ((typeof output) === "string") {
      return output;
    }
    return util.inspect(output, {colors: true});
  }

  start(done) {
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > ",
      useGlobal: true,
      eval: this.enhancedEval.bind(this),
      writer: this.enhancedWriter.bind(this),
      input: this.inputStream,
      output: this.outputStream,
      terminal: true
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
