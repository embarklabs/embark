const repl = require("repl");

class REPL {
  constructor(options) {
    this.env = options.env;
  }

  start(done) {
    repl.start({
      prompt: "Embark (" + this.env + ") > "
    });

    done();
  }
}

module.exports = REPL;
