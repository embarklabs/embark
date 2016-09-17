/* eslint-disable */
"use strict";

var blessed = require("blessed");

//var formatOutput = require("../utils/format-output.js");
//var formatModules = require("../utils/format-modules.js");
//var formatAssets = require("../utils/format-assets.js");

function Dashboard(options) {
  var title = options && options.title || "Embark 2.0";
  this.env = options.env;

  this.color = options && options.color || "green";
  this.minimal = options && options.minimal || false;
  this.setData = this.setData.bind(this);

  this.screen = blessed.screen({
    smartCSR: true,
    title: title,
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  this.layoutLog.call(this);
  this.layoutStatus.call(this);
  this.layoutModules.call(this);
  this.layoutCmd.call(this);

  this.screen.key(["C-c"], function() {
    process.exit(0);
  });

  this.status.setContent(this.env);
  this.moduleTable.setData([
    ["Contract Name", "Address", "Status"],
    ["SimpleStorage", "0x123", "Deployed".green]
  ]);

  this.screen.render();

  this.input.focus();
}

Dashboard.prototype.setData = function(dataArr) {
  var self = this;

  self.logText.log(dataArr);

  this.screen.render();
};

Dashboard.prototype.layoutLog = function() {
  this.log = blessed.box({
    label: "Logs",
    padding: 1,
    width: "100%",
    height: "55%",
    left: "0%",
    top: "42%",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
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
};

Dashboard.prototype.layoutModules = function() {
  this.modules = blessed.box({
    label: "Contracts",
    tags: true,
    padding: 1,
    width: "75%",
    height: "42%",
    left: "0%",
    top: "0",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.moduleTable = blessed.table({
    parent: this.modules,
    height: "100%",
    width: "100%-5",
    align: "left",
    pad: 1,
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
};

Dashboard.prototype.layoutAssets = function() {
  this.assets = blessed.box({
    label: "Asset Pipeline",
    tags: true,
    padding: 1,
    width: "50%",
    height: "55%",
    left: "50%",
    top: "42%",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
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
};

Dashboard.prototype.layoutStatus = function() {

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
      left: 1,
    },
    width: "100%",
    height: "25%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.operations = blessed.box({
    parent: this.wrapper,
    label: "Status",
    tags: true,
    padding: {
      left: 1,
    },
    width: "100%",
    height: "25%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.progress = blessed.box({
    parent: this.wrapper,
    label: "Available Services",
    tags: true,
    padding: this.minimal ? {
      left: 1,
    } : 1,
    width: "100%",
    height: "58%",
    valign: "middle",
    border: {
      type: "line",
    },
    style: {
      fg: -1,
      border: {
        fg: this.color,
      },
    },
  });

  this.screen.append(this.wrapper);
};


Dashboard.prototype.layoutCmd = function() {
  this.consoleBox = blessed.box({
    label: 'Console',
    tags: true,
    padding: 0,
    width: '100%',
    height: '6%',
    left: '0%',
    top: '95%',
    border: {
      type: 'line',
    },
    style: {
      fg: 'black',
      border: {
        fg: this.color,
      },
    },
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

  var self = this;

  this.input.key(["C-c"], function() {
    process.exit(0);
  });

  this.input.on('submit', function(data) {
    if (data !== '') {
      self.logText.log('console> ' + data);
    }
    if (data === 'quit') {
      exit();
    };
    self.input.clearValue();
    self.input.focus();
  });

  this.screen.append(this.consoleBox);
};

module.exports = Dashboard;
