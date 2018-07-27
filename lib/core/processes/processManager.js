
class ProcessManager {
  constructor(options) {
    const self = this;
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.processes = {};

    self.events.setCommandHandler('processes:register', (name, cb) => {
      this.processes[name] = {
        state: 'unstarted',
        cb: cb
      };
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      let process = self.processes[name];
      if (process.state != 'unstarted') {
        return cb();
      }
      process.state = 'starting';
      process.cb.apply(process.cb, [
        () => {
          process.state = 'running';
          cb();
        }
      ]);
    });
  }

}

module.exports = ProcessManager;
