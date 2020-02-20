import { __ } from 'embark-i18n';
import windowSize from 'window-size';

function getWindowSize() {
  if (windowSize) {
    return windowSize.get();
  }
  return {width: 240, height: 75};
}

let Monitor = require('./monitor.js');

class Dashboard {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.env = options.env;
    this.ipc = options.ipc;

    this.events.on('firstDeploymentDone', this.checkWindowSize.bind(this));
    this.events.on('outputDone', this.checkWindowSize.bind(this));
  }

  checkWindowSize() {
    let size = getWindowSize();
    if (size.height < 40 || size.width < 118) {
      this.logger.warn(__("tip: you can resize the terminal or disable the dashboard with") + " embark run --nodashboard".bold.underline);
    }
  }

  start(done) {
    let monitor;

    monitor = new Monitor({env: this.env, events: this.events, version: this.version, ipc: this.ipc, logger: this.logger});
    this.logger.logFunction = monitor.logEntry;
    let plugin = this.plugins.createPlugin('dashboard', {});
    plugin.registerAPICall(
      'ws',
      '/embark-api/dashboard',
      (ws, _req) => {
        let dashboardState = {contractsState: [], environment: "", status: "", availableServices: []};
        self.events.on('status', (status) => {
          dashboardState.status = status;
          ws.send(JSON.stringify(dashboardState));
        });
        self.events.on('servicesState', (servicesState) => {
          dashboardState.availableServices = servicesState;
          ws.send(JSON.stringify(dashboardState));
        });
      }
    );

    this.events.on("deployment:contract:error", (_contract) => {
      this.events.request("contracts:state", (err, contracts) => {
        monitor.setContracts(contracts);
      });
    });

    this.events.on("deployment:contract:deployed", (_contract) => {
      this.events.request("contracts:state", (err, contracts) => {
        this.events.emit('contracts:state', contracts);
        monitor.setContracts(contracts);
      });
    });

    this.events.on("deployment:contract:undeployed", (_contract) => {
      this.events.request("contracts:state", (err, contracts) => {
        this.events.emit('contracts:state', contracts);
        monitor.setContracts(contracts);
      });
    });

    this.events.on('status', monitor.setStatus.bind(monitor));
    this.events.on('servicesState', monitor.availableServices.bind(monitor));

    this.logger.info('========================'.bold.green);
    this.logger.info((__('Welcome to Embark') + ' ' + this.version).yellow.bold);
    this.logger.info('========================'.bold.green);

    done();
  }
}

module.exports = Dashboard;
