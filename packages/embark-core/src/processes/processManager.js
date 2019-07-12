import { __ } from 'embark-i18n';

const ProcessState = {
  Stopped: 'stopped',
  Starting: 'starting',
  Running: 'running',
  Stopping: 'stopping',
  Errored: 'errored'
};

export class ProcessManager {
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
    // TODO: removed because Process Manager shouldn't care or have knoweldge about deployment
    // this.events.once("deploy:beforeAll", this._registerCommands.bind(this));
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

  _registerCommands() {
    // do not allow whisper service to be started/stopped as it requires a restart of embark
    const availableProcesses = Object.keys(this.processes).filter((name) => !["whisper", "embark"].includes(name.toLowerCase()));
    this.plugin.registerConsoleCommand({
      description: __(`Starts/stops the process. Options: ${availableProcesses.join(", ")}`),
      matches: (cmd) => {
        return availableProcesses.some((name) => {
          name = name.toLowerCase();
          return [`service ${name} on`, `service ${name} off`].includes(cmd.toLowerCase());
        });
      },
      usage: `service [process] on/off`,
      process: (cmd, callback) => {
        const enable = cmd.trim().endsWith('on');
        const matches = cmd.match(/^service[\s](.*)[\s](?:on|off)$/) || [];
        const name = matches[1];
        this.logger.info(`${enable ? 'Starting' :  'Stopping'} the ${name} process...`);
        if(enable) {
          return this.events.request("processes:launch", name, (...args) => {
            const err = args[0];
            if (err) {
              this.logger.error(err); // writes to embark's console
              return callback(err); // passes message back to cockpit
            }
            const process = this.processes[name];
            if (process && process.afterLaunchFn) {
              process.afterLaunchFn.apply(process.afterLaunchFn, args);
            }
            callback(err, `${name} process started.`); // passes a message back to cockpit console
          });
        }
        this.events.request("processes:stop", name, (err) => {
          if (err) {
            this.logger.error(err); // writes to embark's console
            callback(err); // passes message back to cockpit
          }
          callback(err, `${name} process stopped.`); // passes a message back to cockpit console
        });
      }
    });
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
    });

    self.events.setCommandHandler('processes:launch', (name, cb) => {
      cb = cb || function noop() {};
      let process = self.processes[name];
      if (![ProcessState.Stopped, ProcessState.Errored].includes(process.state)) {
        return cb(__(`The ${name} process is already ${process.state.toLowerCase()}.`));
      }
      process.state = ProcessState.Starting;
      if(!process.afterLaunchFn) process.afterLaunchFn = cb;
      process.cb.apply(process.cb, [
        (...args) => {
          if(args[0]) {
            process.state = ProcessState.Errored;
          }
          else process.state = ProcessState.Running;
          cb.apply(cb, args);
        }
      ]);
    });

    self.events.setCommandHandler('processes:stop', (name, cb) => {
      let process = self.processes[name];
      if (!process) {
        // Process was never started
        return cb();
      }
      cb = cb || function noop() {};
      if (![ProcessState.Running, ProcessState.Errored].includes(process.state)) {
        return cb(__(`The ${name} process is already ${process.state.toLowerCase()}.`));
      }
      process.state = ProcessState.Stopping;
      process.stopFn.apply(process.stopFn, [
        (...args) => {
          if(args[0]) {
            process.state = ProcessState.Errored;
          }
          else process.state = ProcessState.Stopped;
          cb.apply(cb, args);
        }
      ]);
    });
  }
}
