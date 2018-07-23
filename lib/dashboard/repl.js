const repl = require("repl");

class REPL {
  constructor(options) {
    this.env = options.env;
  }

  start(done) {
    let replServer = repl.start({
      prompt: "Embark (" + this.env + ") > "
    });

    replServer.on('exit', () => {
      process.exit();
    });

    done();
  }
}

module.exports = REPL;
