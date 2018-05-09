
let __MessageEvents = function() {
  this.cb = function() {};
};

__MessageEvents.prototype.then = function(cb) {
  this.cb = cb;
};

__MessageEvents.prototype.error = function(err) {
  return err;
};

__MessageEvents.prototype.stop = function() {
  this.filter.stopWatching();
};

