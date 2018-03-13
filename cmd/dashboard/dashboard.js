let async = require('async');
let windowSize = require('window-size');

let Monitor = require('./monitor.js');

class Dashboard {
  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.plugins = options.plugins;
    this.version = options.version;
    this.env = options.env;

    this.events.on('firstDeploymentDone', this.checkWindowSize.bind(this));
    this.events.on('outputDone', this.checkWindowSize.bind(this));
  }

  checkWindowSize() {
    let size = windowSize.get();
    if (size.height < 40 || size.width < 118) {
      this.logger.warn(__("tip: you can resize the terminal or disable the dashboard with") + " embark run --nodashboard".bold.underline);
    }
  }

  start(done) {
    let monitor;

    monitor = new Monitor({env: this.env, events: this.events});
    this.logger.logFunction = monitor.logEntry;
    let plugin = this.plugins.createPlugin('dashboard', {});
    plugin.registerAPICall(
      'ws',
      '/embark/dashboard',
      (ws, req) => {
        let dashboardState = { contractsState: [], environment: "", status: "", availableServices: [] };

        // TODO: doesn't feel quite right, should be refactored into a shared
        // dashboard state
        self.events.request('setDashboardState');

        self.events.on('contractsState', (contracts) => {
          dashboardState.contractsState = [];

          contracts.forEach(function (row) {
            dashboardState.contractsState.push({contractName: row[0], address: row[1], status: row[2]});
          });
          ws.send(JSON.stringify(dashboardState));
        });
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

    this.events.on('contractsState', monitor.setContracts);
    this.events.on('status', monitor.setStatus.bind(monitor));
    this.events.on('servicesState', monitor.availableServices.bind(monitor));

    this.events.setCommandHandler("console:command", monitor.executeCmd.bind(monitor));

    this.logger.info('========================'.bold.green);
    this.logger.info((__('Welcome to Embark') + ' ' + this.version).yellow.bold);
    this.logger.info('========================'.bold.green);

    done();
  }
}

module.exports = Dashboard;
