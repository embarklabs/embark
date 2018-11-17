const repl = require("repl");
const util = require("util");
let fs = require('../../lib/core/fs');

class REPL {
  constructor(options) {
    this.events = options.events;
    this.env = options.env;
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
      writer: this.enhancedWriter.bind(this)
    });

    this.events.request('console:history', (err, history) => {
      history
        .split('\n')
        .forEach((cmd) => { this.replServer.history.push(cmd); });
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
