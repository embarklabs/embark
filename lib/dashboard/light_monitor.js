let blessed = require("neo-blessed");
let CommandHistory = require('./command_history.js');

class LightMonitor {
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
    this.layoutCmd();

    this.screen.key(["C-c"], function () {
      process.exit(0);
    });

    this.logEntry = this.logEntry.bind(this);

    this.screen.render();
    this.input.focus();
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
      height: "100%",
      left: "0%",
      top: "0%",
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
    self.console.executeCmd(cmd, function (result) {
      self.logText.log(result);
      if (cb) {
        cb(result);
      }
    });
  }

}

module.exports = LightMonitor;
