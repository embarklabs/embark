const repl = require("repl");

class REPL {
  constructor(options) {
    this.env = options.env;
    this.plugins = options.plugins;
  }

  start(done) {
    this.replServer = repl.start({
      prompt: "Embark (" + this.env + ") > ",
      useGlobal: true
    });

    this.replServer.on("exit", () => {
      process.exit();
    });

    let self = this;
    this.replServer.defineCommand('profile', {
      help: 'Profile a contract',
      action(contract) {
        this.clearBufferedCommand();
        let pluginCmds = self.plugins.getPluginsProperty('console', 'console');
        for (let pluginCmd of pluginCmds) {
          pluginCmd.call(self, `profile ${contract}`, {});
        }
        this.displayPrompt();
      }
    });

    done();
  }

}

module.exports = REPL;
