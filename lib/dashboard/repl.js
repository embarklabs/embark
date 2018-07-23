const repl = require("repl");
const RunCode = require('../coderunner/runCode');

class REPL {
  constructor(options) {
    this.env = options.env;
  }

  start(done) {
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > "
    });
    this.initializeContext(this.replServer.context);

    this.replServer.on("exit", () => {
      process.exit();
    });

    done();
  }

  initializeContext(context) {
    context.embark = RunCode.getContext();
  }
}

module.exports = REPL;
