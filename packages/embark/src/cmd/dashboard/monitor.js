import { __ } from 'embark-i18n';
let blessed = require("neo-blessed");
const REPL = require('./repl.js');
const stream = require('stream');
const util = require('util');

class Monitor {
  constructor(_options) {
    let options = _options || {};
    this.env = options.env;
    this.console = options.console;
    this.events = options.events;
    this.logger = options.logger;
    this.color = options.color || "green";
    this.minimal = options.minimal || false;
    this.ipc = options.ipc;

    this.screen = blessed.screen({
      smartCSR: true,
      title: options.title || ("Embark " + options.version),
      dockBorders: false,
      fullUnicode: true,
      autoPadding: true
    });

    this.layoutStatus();
    this.layoutModules();
    this.layoutLog();
    this.layoutTerminal();

    this.screen.key(["C-c"], function () {
      process.exit(0);
    });

    this.logEntry = this.logEntry.bind(this);
    this.setContracts = this.setContracts.bind(this);
    this.availableServices = this.availableServices.bind(this);

    this.environmentBox.setContent(this.env.green);

    this.screen.render();

    this.terminalReadableStream = new stream.Readable({
      read() {}
    });

    const terminal = this.terminal;
    const terminalWritableStream = new stream.Writable({
      write(chunk, encoding, next) {
        terminal.write(chunk.toString());
        next();
      }
    });

    this.repl = new REPL({
      events: this.events,
      env: this.env,
      inputStream: this.terminalReadableStream,
      outputStream: terminalWritableStream,
      logText: this.logText,
      ipc: this.ipc,
      useDashboard: true,
      logger: this.logger
    }).start(() => {
      this.terminal.focus();
    });
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

    this.servicesBox.setContent(services.join('\n'));
    this.screen.render();
  }

  setStatus(status) {
    this.statusBox.setContent(status);
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

  logEntry(args, color) {
    args  = Array.isArray(args) ? args : [args];
    this.logText.log(...(args.filter(arg => arg ?? false).map(arg => {
      if (typeof arg === 'object') arg = util.inspect(arg, 2);
      return color ? arg[color] : arg;
    })));
    this.screen.render();
  }

  layoutLog() {
    this.log = blessed.box({
      label: __("Logs"),
      padding: 1,
      width: "100%",
      height: "55%",
      left: "0%",
      top: "40%",
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
      height: "40%",
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
    this.environmentBox = blessed.box({
      label: __("Environment"),
      tags: true,
      padding: {
        left: 1
      },
      width: "25%",
      height: "8%",
      left: "75%",
      top: '0%',
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        border: {
          fg: this.color
        }
      }
    });

    this.statusBox = blessed.box({
      label: __("Status"),
      tags: true,
      padding: {
        left: 1
      },
      width: "25%",
      height: "8%",
      left: "75%",
      top: '8%',
      valign: "middle",
      border: {
        type: "line"
      },
      style: {
        border: {
          fg: this.color
        }
      }
    });

    this.servicesBox = blessed.box({
      label: __("Available Services"),
      tags: true,
      padding: {
        left: 1
      },
      width: "25%",
      height: "24%",
      left: "75%",
      top: '16%',
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
        border: {
          fg: this.color
        }
      }
    });

    this.screen.append(this.environmentBox);
    this.screen.append(this.statusBox);
    this.screen.append(this.servicesBox);
  }

  layoutTerminal() {
      this.terminal = blessed.terminal({
        parent: this.screen,
        cursor: 'block',
        cursorBlink: true,
        padding: 0,
        width: '100%',
        height: 3,
        left: 0,
        top: '100%-3',
        border: 'line',
        style: {
            fg: 'default',
            bg: 'default',
            focus: {
                border: {
                    fg: 'green'
                }
            }
        },
        scrollable: false,
        handler: (data) => {
          this.terminalReadableStream.push(data);
        }
      });

      this.terminal.key('C-c', () => {
        this.terminal.kill();
        return screen.destroy();
      });

      this.terminal.on('click', () => {
        this.terminal.focus();
      });
  }
}

module.exports = Monitor;
