let fs = require('../../lib/core/fs');

class CommandHistory {
  constructor(options = {}) {
    this.cmdHistoryFile = options.cmdHistoryFile
      || process.env.DEFAULT_CMD_HISTORY_PATH;
    this.history = [];
    this.pointer = -1;
    this.loadHistory();
  }

  addCommand(cmd) {
    this.history.push(cmd);
    this.pointer = this.history.length;
  }

  getPreviousCommand() {
    if (this.pointer >= 0) {
      this.pointer--;
    }
    return this.history[this.pointer];
  }

  getNextCommand() {
    if (this.pointer >= this.history.length) {
      this.pointer = this.history.length - 1;
      return '';
    }
    this.pointer++;
    return this.history[this.pointer];
  }

  loadHistory() {
    if (fs.existsSync(this.cmdHistoryFile)) {
      fs.readFileSync(this.cmdHistoryFile)
        .toString()
        .split('\n')
        .reverse()
        .forEach((cmd) => { this.addCommand(cmd); })
    }
  }

}
module.exports = CommandHistory;
