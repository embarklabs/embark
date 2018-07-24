const repl = require("repl");

class REPL {
  constructor(options) {
    this.env = options.env;
  }

  start(done) {
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > ",
      useGlobal: true
    });

    this.replServer.on("exit", () => {
      process.exit();
    });

    done();
  }

}

module.exports = REPL;
