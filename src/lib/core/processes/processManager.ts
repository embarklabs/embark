const ProcessState = {
  Running: "running",
  Starting: "starting",
  Stopping: "stopping",
  Unstarted: "unstarted",
};

class ProcessManager {
  private logger: any;
  private events: any;
  private plugins: any;
  private plugin: any;
  private processes: any;
  private servicesState: any;

  constructor(options: any) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.processes = {};
    this.servicesState = {};

    this.events.on("servicesState", (servicesState: any) => {
      this.servicesState = servicesState;
    });

    this._registerAsPlugin();
    this._registerEvents();
  }

  private _registerAsPlugin() {
    const self = this;
    self.plugin = this.plugins.createPlugin("processManager", {});

    self.plugin.registerAPICall(
      "get",
      "/embark-api/services",
      (req: any, res: any) => {
        res.send(this._sevicesForApi(this.servicesState));
      },
    );

    self.plugin.registerAPICall(
      "ws",
      "/embark-api/services",
      (ws: any, _res: any) => {
        this.events.on("servicesState", (servicesState: any) => {
          ws.send(JSON.stringify(this._sevicesForApi(servicesState)), () => undefined);
        });
      },
    );

    self.plugin.registerAPICall(
      "get",
      "/embark-api/processes",
      (req: any, res: any) => {
        const formatter = (acc: any[], processName: string) => {
          acc.push({state: self.processes[processName].state, name: processName});
          return acc;
        };
        res.send(Object.keys(self.processes).reduce(formatter, []));
      },
    );
  }

  private _sevicesForApi(servicesState: any) {
    const processList = [];
    for (const serviceName of Object.keys(servicesState)) {
      const service = servicesState[serviceName];
      processList.push({state: service.status, name: serviceName, description: service.name});
    }
    return processList;
  }

  private _registerEvents() {
    const self = this;
    self.events.setCommandHandler("processes:register", (name: string, cb: any) => {
      let launchFn;
      let stopFn;

      if (typeof cb === "object") {
        launchFn = cb.launchFn;
        stopFn = cb.stopFn;
      }

      this.processes[name] = {
        cb: launchFn || cb,
        name,
        state: ProcessState.Unstarted,
        stopFn: stopFn || (() => {}),
      };
    });

    self.events.setCommandHandler("processes:launch", (name: string, cb: any) => {
      cb = cb || (() => {});
      const process = self.processes[name];
      if (process.state !== ProcessState.Unstarted) {
        return cb();
      }
      process.state = ProcessState.Starting;
      process.cb.apply(process.cb, [
        (...args: any) => {
          process.state = ProcessState.Running;
          cb.apply(cb, args);
        },
      ]);
    });

    self.events.setCommandHandler("processes:stop", (name: string, cb: any) => {
      const process = self.processes[name];
      cb = cb || (() => {});
      if (process.state !== ProcessState.Running) {
        return cb();
      }
      process.state = ProcessState.Stopping;
      process.stopFn.apply(process.stopFn, [
        (...args: any) => {
          process.state = ProcessState.Unstarted;
          cb.apply(cb, args);
        },
      ]);
    });
  }
}

export default ProcessManager;
