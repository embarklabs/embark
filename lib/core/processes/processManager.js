
class ProcessManager {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.processes = {};

    this._registerAsPlugin();
    this._registerEvents();
  }

  _registerAsPlugin() {
    const self  =this;
    self.plugin = this.plugins.createPlugin('processManager', {});
    self.plugin.registerAPICall(
      'get',
      '/embark/processes',
      (req, res) => {
        let parsedProcesses = {};
        Object.keys(self.processes).forEach(processName => {
          parsedProcesses[processName] = {
            state: self.processes[processName]
          };
        });
        res.send(parsedProcesses);
      }
    );
  }

  _registerEvents() {
    const self = this;
    self.events.setCommandHandler('processes:register', (name, cb) => {
      this.processes[name] = {
        state: 'unstarted',
        cb: cb
      };
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      let process = self.processes[name];
      if (process.state !== 'unstarted') {
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
