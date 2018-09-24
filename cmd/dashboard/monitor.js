let blessed = require("neo-blessed");
const REPL = require('./repl.js');
const stream = require('stream');

class Monitor {
  constructor(_options) {
    let options = _options || {};
    this.env = options.env;
    this.console = options.console;
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
    this.layoutTerminal();

    this.screen.key(["C-c"], function () {
      process.exit(0);
    });

    this.logEntry = this.logEntry.bind(this);
    this.setContracts = this.setContracts.bind(this);
    this.availableServices = this.availableServices.bind(this);

    this.status.setContent(this.env.green);

    this.screen.render();

    this.terminalReadableStream = new stream.Readable({
      read() {}
    });

    const logText = this.logText;
    const terminal = this.terminal;
    const terminalWritableStream = new stream.Writable({
      write(chunk, encoding, next) {
        // const terminalPrompt = "Embark (" + this.env + ") > ";
        // const chunkString = chunk.toString();

        // if (chunkString.contains(terminalPrompt)) {
        //     // terminal.write()
        // }
        // else {

        // }

        // const regex = new RegExp(`(.*)(${terminalPrompt})`);
        // const groups = regex.exec(chunkString);

        // if (groups === null) {
        //   terminal.write(chunk.toString());
        // }
        // else {
        //   logText.log(groups[1]);
        //   terminal.write(groups[2]);
        // }

        terminal.write(chunk.toString());

        next();
      }
    });

    // process.stderr.on('data', (data) => {
    //   this.logText.log(data.toString());
    //   // process.exit(0);
    // });

    // process.stderr.on('data', (data) => {
    //   require('fs').writeFileSync('temp-repl-output', 'monkey-12345');
    // });

    // setTimeout(() => {
    //   console.error('monkey')
    // }, 5000);

    const repl = new REPL({
      events: this.events,
      env: this.env,
      inputStream: this.terminalReadableStream,
      outputStream: terminalWritableStream,
      logText: this.logText
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
