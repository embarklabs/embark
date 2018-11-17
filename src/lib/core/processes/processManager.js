
const ProcessState = {
  Unstarted: 'unstarted',
  Starting: 'starting',
  Running: 'running',
  Stopping: 'stopping'
};

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
    const self = this;
    self.plugin = this.plugins.createPlugin('processManager', {});

    this.servicesState = {};
    this.events.on("servicesState", (servicesState) => {
      this.servicesState = servicesState;
    });

    self.plugin.registerAPICall(
      'get',
      '/embark-api/services',
      (req, res) => {
        let processList = [];
        for (let serviceName in this.servicesState) {
          let service = this.servicesState[serviceName];
          processList.push({state: service.status, name: serviceName, description: service.name});
        }
        res.send(processList);
      }
    );

    self.plugin.registerAPICall(
      'get',
      '/embark-api/processes',
      (req, res) => {
        const formatter = (acc, processName) => {
          acc.push({state: self.processes[processName].state, name: processName});
          return acc;
        };
        res.send(Object.keys(self.processes).reduce(formatter, []));
      }
    );
  }

  _registerEvents() {
    const self = this;
    self.events.setCommandHandler('processes:register', (name, cb) => {

      let launchFn, stopFn;

      if (typeof cb === 'object') {
        launchFn = cb.launchFn;
        stopFn = cb.stopFn;
      }

      this.processes[name] = {
        name: name,
        state: ProcessState.Unstarted,
        cb: launchFn || cb,
        stopFn: stopFn || function noop () {}
      };
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      cb = cb || function noop() {};
      let process = self.processes[name];
      if (process.state !== ProcessState.Unstarted) {
        return cb();
      }
      process.state = ProcessState.Starting;
      process.cb.apply(process.cb, [
        (...args) => {
          process.state = ProcessState.Running;
          cb.apply(cb, args);
        }
      ]);
    });

    self.events.setCommandHandler('processes:stop', (name, cb) => {
      let process = self.processes[name];
      cb = cb || function noop() {};
      if (process.state !== ProcessState.Running) {
        return cb();
      }
      process.state = ProcessState.Stopping;
      process.stopFn.apply(process.stopFn, [
        (...args) => {
          process.state = ProcessState.Unstarted;
          cb.apply(cb, args);
        }
      ]);
    });
  }
}

module.exports = ProcessManager;
