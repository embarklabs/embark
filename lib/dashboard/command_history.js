
var CommandHistory = function() {
  this.history = [];
  this.pointer = -1;
};

CommandHistory.prototype.addCommand = function(cmd) {
  this.history.push(cmd);
  this.pointer = this.history.length;
};

CommandHistory.prototype.getPreviousCommand = function(cmd) {
  if (this.pointer >= 0) {
    this.pointer--;
  }
  return this.history[this.pointer];
};

CommandHistory.prototype.getNextCommand = function(cmd) {
  if (this.pointer >= this.history.length) {
    this.pointer = this.history.length - 1;
    return '';
  }
  this.pointer++;
  return this.history[this.pointer];
};

module.exports = CommandHistory;
