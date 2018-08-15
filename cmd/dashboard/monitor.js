let blessed = require("neo-blessed");
let CommandHistory = require('./command_history.js');

class Monitor {
  constructor(_options) {
    let options = _options || {};
    this.env = options.env;
    this.console = options.console;
    this.history = new CommandHistory();
    this.events = options.events;

    this.color = options.color || "green";
    this.minimal = options.minimal || false;

    this.screen = blessed.screen({
      smartCSR: true,
      title: options.title || ("Embark " + options.version),
      dockBorders: false,
      fullUnicode: true,
      autoPadding: true
    });

    this.layoutLog();
    this.layoutStatus();
    this.layoutModules();
    this.layoutCmd();

    this.screen.key(["C-c"], function () {
      process.exit(0);
    });

    this.logEntry = this.logEntry.bind(this);
    this.setContracts = this.setContracts.bind(this);
    this.availableServices = this.availableServices.bind(this);

    this.status.setContent(this.env.green);

    this.screen.render();
    this.input.focus();
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

  logEntry() {
    this.logText.log(...arguments);
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

  layoutAssets() {
    this.assets = blessed.box({
      label: __("Asset Pipeline"),
      tags: true,
      padding: 1,
      width: "50%",
      height: "55%",
      left: "50%",
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

    this.assetTable = blessed.table({
      parent: this.assets,
      height: "100%",
      width: "100%-5",
      align: "left",
      pad: 1,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: " ",
        inverse: true
      },
      keys: false,
      vi: false,
      mouse: true,
      data: [["Name", "Size"]]
    });

    this.screen.append(this.assets);
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

  layoutCmd() {
    this.consoleBox = blessed.box({
      label: __('Console'),
      tags: true,
      padding: 0,
      width: '100%',
      height: '6%',
      left: '0%',
      top: '95%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'black',
        border: {
          fg: this.color
        }
      }
    });

    this.input = blessed.textbox({
      parent: this.consoleBox,
      name: 'input',
      input: true,
      keys: false,
      top: 0,
      left: 1,
      height: '50%',
      width: '100%-2',
      inputOnFocus: true,
      style: {
        fg: 'green',
        bg: 'black',
        focus: {
          bg: 'black',
          fg: 'green'
        }
      }
    });

    let self = this;

    this.input.key(["C-c"], function () {
      self.events.emit('exit');
      process.exit(0);
    });

    this.input.key(["C-w"], function () {
      self.input.clearValue();
      self.input.focus();
    });

    this.input.key(["up"], function () {
      let cmd = self.history.getPreviousCommand();
      self.input.setValue(cmd);
      self.input.focus();
    });

    this.input.key(["down"], function () {
      let cmd = self.history.getNextCommand();
      self.input.setValue(cmd);
      self.input.focus();
    });

    this.input.on('submit', this.submitCmd.bind(this));

    this.screen.append(this.consoleBox);
  }

  submitCmd(cmd) {
    if (cmd !== '') {
      this.history.addCommand(cmd);
      this.executeCmd(cmd);
    }
    this.input.clearValue();
    this.input.focus();
  }

  executeCmd(cmd, cb) {
    const self = this;
    self.logText.log('console> '.bold.green + cmd);
    self.console.executeCmd(cmd, function (err, result) {
      let message = err || result;
      self.logText.log(message);
      if (cb) {
        cb(message);
      }
    });
  }

}

module.exports = Monitor;
