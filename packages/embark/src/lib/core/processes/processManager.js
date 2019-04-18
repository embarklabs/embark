const ProcessState = {
  Stopped: 'stopped',
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
    this.servicesState = {};
    this.plugin = this.plugins.createPlugin('processManager', {});

    this.events.on("servicesState", (servicesState) => {
      this.servicesState = servicesState;
    });

    this._registerApiCalls();
    this._registerEvents();
  }

  _registerApiCalls() {

    this.plugin.registerAPICall(
      'get',
      '/embark-api/services',
      (req, res) => {
        res.send(this._servicesForApi(this.servicesState));
      }
    );

    this.plugin.registerAPICall(
      'ws',
      '/embark-api/services',
      (ws, _res) => {
        this.events.on('servicesState', (servicesState) => {
          ws.send(JSON.stringify(this._servicesForApi(servicesState)), () => undefined);
        });
      }
    );

    this.plugin.registerAPICall(
      'get',
      '/embark-api/processes',
      (req, res) => {
        const formatter = (acc, processName) => {
          acc.push({state: this.processes[processName].state, name: processName});
          return acc;
        };
        res.send(Object.keys(this.processes).reduce(formatter, []));
      }
    );
  }

  _servicesForApi(servicesState) {
    let processList = [];
    for (let serviceName in servicesState) {
      let service = servicesState[serviceName];
      processList.push({state: service.status, name: serviceName, description: service.name});
    }
    return processList;
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
        state: ProcessState.Stopped,
        cb: launchFn || cb,
        stopFn: stopFn || function noop () {}
      };

      this.plugin.registerConsoleCommand({
        description: __(`Starts/stops the ${name} process`),
        matches: [`service ${name} on`, `service ${name} off`],
        usage: `service ${name} on/off`,
        process: (cmd, callback) => {
          const enable = cmd.trim().endsWith('on');
          this.logger.info(`${enable ? 'Starting' :  'Stopping'} the ${name} process...`);
          if(enable) {
            return this.events.request("processes:launch", name, (err) => {
              if (err) this.logger.info(err); // writes to embark's console
              const process = self.processes[name];
              if(process && process.afterLaunchFn) {
                process.afterLaunchFn.call(process.afterLaunchFn, err);
              }
              callback(err, `${name} process started.`); // passes a message back to cockpit console
            });
          }
          this.events.request("processes:stop", name, (err) => {
            if (err) this.logger.info(err); // writes to embark's console
            callback(err, `${name} process stopped.`); // passes a message back to cockpit console
          });
        }
      });
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      cb = cb || function noop() {};
      let process = self.processes[name];
      if (process.state !== ProcessState.Stopped) {
        return cb(__(`The ${name} process is already ${process.state.toLowerCase()}.`));
      }
      process.state = ProcessState.Starting;
      if(!process.afterLaunchFn) process.afterLaunchFn = cb;
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
        return cb(__(`The ${name} process is already ${process.state.toLowerCase()}.`));
      }
      process.state = ProcessState.Stopping;
      process.stopFn.apply(process.stopFn, [
        (...args) => {
          process.state = ProcessState.Stopped;
          cb.apply(cb, args);
        }
      ]);
    });
  }
}

module.exports = ProcessManager;
