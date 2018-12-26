declare var process: any;
// @ts-ignore
import uuid from "uuid/v1";
const constants = require("../../constants");

class Events {
  private subscribedEvents: any;

  /**
   * Constructs an event wrapper for processes.
   * Handles sending an event message to the parent process and waiting for its response
   * No need to create an instance of eventsWrapper for your own process, just extend ProcessWrapper
   *  Then, you an use `this.events.[on|request]` with the usual parameters you would use
   */
  constructor() {
    this.subscribedEvents = {};
    this.listenToParentProcess();
  }

  private listenToParentProcess() {
    process.on("message", (msg: any) => {
      if (!msg.event || msg.event !== constants.process.events.response) {
        return;
      }
      if (!this.subscribedEvents[msg.eventId]) {
        return;
      }
      this.subscribedEvents[msg.eventId](msg.result);
    });
  }

  private sendEvent(..._args: any) {
    const eventType = _args[0];
    const requestName = _args[1];

    let args = [].slice.call(_args, 2);
    const eventId = uuid();
    this.subscribedEvents[eventId] = args[args.length - 1];
    args = args.splice(0, args.length - 2);

    process.send({
      args,
      event: eventType,
      eventId,
      requestName,
    });
  }

  public on(...args: any) {
    this.sendEvent(constants.process.events.on, ...args);
  }

  public request(...args: any) {
    this.sendEvent(constants.process.events.request, ...args);
  }
}

export default Events;
