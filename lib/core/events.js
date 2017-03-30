//TODO: This is deprecated because Embark extends EventEmitter now
let events = require('events');

class EventEmitter {
  constructor(options) {
    this.options = options;
  }
}

EventEmitter.prototype = Object.create(events.EventEmitter.prototype);

module.exports = EventEmitter;
