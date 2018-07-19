
class ProcessManager {
  constructor(options) {
    const self = this;
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.processes = {};

    self.events.setCommandHandler('processes:register', (name, cb) => {
      console.dir("=====> registering " + name);
      this.processes[name] = {
        state: 'unstarted',
        cb: cb
      }
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      let process = self.processes[name];
      // TODO: should make distinction between starting and running
      if (process.state != 'unstarted') {
        console.dir("=====> already started " + name);
        return cb();
      }
      console.dir("=====> launching " + name);
      process.state = 'starting';
      //let pry = require('pryjs');
      //eval(pry.it);
      process.cb.apply(process.cb, [() => {
        process.state = 'running';
        console.dir("=====> launched " + name);
        cb();
      }]);
    });
  }

}

module.exports = ProcessManager;
