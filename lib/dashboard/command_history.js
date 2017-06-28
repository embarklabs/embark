class CommandHistory {
  constructor() {
    this.history = [];
    this.pointer = -1;
  }

  addCommand(cmd) {
    this.history.push(cmd);
    this.pointer = this.history.length;
  }

  getPreviousCommand(cmd) {
    if (this.pointer >= 0) {
      this.pointer--;
    }
    return this.history[this.pointer];
  }

  getNextCommand(cmd) {
    if (this.pointer >= this.history.length) {
      this.pointer = this.history.length - 1;
      return '';
    }
    this.pointer++;
    return this.history[this.pointer];
  }
}

module.exports = CommandHistory;
