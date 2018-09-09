class PluginCommand {
  constructor(embark) {
    console.log(embark);
    //this.embark = embark;
    //this.registerCommands();
  }
  registerCommands() {
    const self = this;
    self.embark.registerConsoleCommand((cmd, _options) => {
      return {
        match: () => cmd === 'webserver start',
        process: (cb) => self.events.request('start-webserver', cb)
      };
    });
  }
}

module.exports = PluginCommand;
