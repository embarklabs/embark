let blessed = require("neo-blessed");
let LightMonitor = require('./light_monitor');

class Monitor extends LightMonitor {
  constructor(_options) {
    super(_options);

    this.layoutStatus();
    this.layoutModules();

    this.setContracts = this.setContracts.bind(this);
    this.availableServices = this.availableServices.bind(this);
    this.status.setContent(this.env.green);
  }

  availableServices(_services) {
    let stateColors = {
      'on':  'green',
      'off': 'red',
      'warn': 'grey'
    };

    let services = Object.keys(_services).map((service) => {
      let checkObj = _services[service];
      if (checkObj.status in stateColors) {
        let color = stateColors[checkObj.status];
        return checkObj.name[color];
      }
      return checkObj.name;
    });

    this.progress.setContent(services.join('\n'));
    this.screen.render();
  }

  setStatus(status) {
    this.operations.setContent(status);
    this.screen.render();
  }

  setContracts(contracts) {
    let data = [];

    data.push([__("Contract Name"), __("Address"), __("Status")]);

    contracts.forEach(function (row) {
      data.push(row);
    });

    this.moduleTable.setData(data);
    this.screen.render();
  }

  layoutLog() {
    this.log = blessed.box({
      label: __("Logs"),
      padding: 1,
      width: "100%",
      height: "55%",
      left: "0%",
      top: "42%",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.logText = blessed.log({
      parent: this.log,
      tags: true,
      width: "100%-5",
      //height: '90%',
      scrollable: true,
      input: false,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: false,
      vi: false,
      mouse: true
    });

    this.screen.append(this.log);
  }

  layoutModules() {
    this.modules = blessed.box({
      label: __("Contracts"),
      tags: true,
      padding: 1,
      width: "75%",
      height: "42%",
      left: "0%",
      top: "0",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.moduleTable = blessed.table({
      parent: this.modules,
      height: "100%",
      width: "100%-5",
      align: "left",
      pad: 1,
      margin: "auto",
      shrink: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: false,
      vi: false,
      mouse: true,
      data: [["ContractName", "Address", "Status"]]
    });

    this.screen.append(this.modules);
  }

  layoutStatus() {
    this.wrapper = blessed.layout({
      width: "25%",
      height: "42%",
      top: "0%",
      left: "75%",
      layout: "grid"
    });

    this.status = blessed.box({
      parent: this.wrapper,
      label: __("Environment"),
      tags: true,
      padding: {
        left: 1
      },
      width: "100%",
      height: "20%",
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.operations = blessed.box({
      parent: this.wrapper,
      label: __("Status"),
      tags: true,
      padding: {
        left: 1
      },
      width: "100%",
      height: "20%",
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.progress = blessed.box({
      parent: this.wrapper,
      label: __("Available Services"),
      tags: true,
      padding: this.minimal ? {
        left: 1
      } : 1,
      width: "100%",
      height: "60%",
      valign: "top",
      border: {
        type: "line"
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      style: {
        fg: -1,
        border: {
          fg: this.color
        }
      }
    });

    this.screen.append(this.wrapper);
  }

}

module.exports = Monitor;
