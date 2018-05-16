const uuid = require('uuid/v1');
const constants = require('../constants');

class Events {
  constructor() {
    this.subscribedEvents = {};
    this.listenToParentProcess();
  }

  listenToParentProcess() {
    process.on('message', (msg) => {
      if (!msg.event || msg.event !== constants.process.events.response) {
        return;
      }
      if (!this.subscribedEvents[msg.eventId]) {
        return;
      }
      this.subscribedEvents[msg.eventId](msg.result);
    });
  }

  sendEvent() {
    const eventType = arguments[0];
    const requestName = arguments[1];

    let args = [].slice.call(arguments, 2);
    const eventId = uuid();
    this.subscribedEvents[eventId] = args[args.length - 1];
    args = args.splice(0, args.length - 2);

    process.send({
      event: eventType,
      requestName,
      args,
      eventId: eventId
    });
  }

  on() {
    this.sendEvent(constants.process.events.on, ...arguments);
  }

  request() {
    this.sendEvent(constants.process.events.request, ...arguments);
  }
}

module.exports = Events;
