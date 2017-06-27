/*jshint esversion: 6 */

let blessed = require("blessed");
let CommandHistory = require('./command_history.js');

class Dashboard {
  constructor(options) {
    let title = (options && options.title) || "Embark " + options.version;
    this.env = options.env;
    this.console = options.console;
    this.history = new CommandHistory();

    this.color = (options && options.color) || "green";
    this.minimal = (options && options.minimal) || false;

    this.screen = blessed.screen({
      smartCSR: true,
      title: title,
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
    let services = [];
    let check;
    for (check in _services) {
      let checkObj = _services[check];
      if (checkObj.status === 'on') {
        services.push(checkObj.name.green);
      } else if (checkObj.status === 'off') {
        services.push(checkObj.name.red);
      } else if (checkObj.status === 'warn') {
        services.push(checkObj.name.grey);
      } else {
        services.push(checkObj.name);
      }
    }

    this.progress.setContent(services.join('\n'));
    this.screen.render();
  }

  setStatus(status) {
    this.operations.setContent(status);
    this.screen.render();
  }

  setContracts(contracts) {
    let data = [];

    data.push(["Contract Name", "Address", "Status"]);

    contracts.forEach(function (row) {
      data.push(row);
    });

    this.moduleTable.setData(data);
    this.screen.render();
  }

  logEntry(text) {
    this.logText.log(text);
    this.screen.render();
  }

  layoutLog() {
    this.log = blessed.box({
      label: "Logs",
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
      label: "Contracts",
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
      label: "Asset Pipeline",
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
      label: "Environment",
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
      label: "Status",
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
      label: "Available Services",
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
      label: 'Console',
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

    this.input.on('submit', function (data) {
      if (data !== '') {
        self.history.addCommand(data);
        self.logText.log('console> '.bold.green + data);
        self.console.executeCmd(data, function (result) {
          self.logText.log(result);
        });
      }
      self.input.clearValue();
      self.input.focus();
    });

    this.screen.append(this.consoleBox);
  }

}

module.exports = Dashboard;
