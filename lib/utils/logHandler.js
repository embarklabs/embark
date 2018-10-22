const utils = require('./utils');

// define max number of logs to keep in memory for this process
// to prevent runaway memory leak
const MAX_LOGS = require('../constants').logs.maxLogLength;

class LogHandler {
  constructor({events, logger, processName, silent}) {
    this.events = events;
    this.logger = logger;
    this.processName = processName;
    this.silent = silent;

    this.logs = [];
    this.removedCount = 0;
  }

  /**
   * Servers as an interception of logs, normalises the message output and
   * adds metadata (timestamp, id) the data,
   * stores the log in memory, then sends it to the logger for output. Max
   * number of logs stored in memory is capped by MAX_LOGS
   * @param {Object} msg Object containing the log message (msg.message)
   * 
   * @returns {void} 
   */
  handleLog(msg) {
    if(!msg) return;

    // Sometimes messages come in with line breaks, so we need to break them up accordingly.
    let processedMessages = [];

    // Ensure that `msg.message` is an array, so we process this consistently. Sometimes it
    // is an Array, sometimes it is a string.
    if(typeof msg.message === 'string') {
      processedMessages = [msg.message];
    } else {
      msg.message.forEach(message => {
        let lines = message.split("\n");
        lines.forEach(line => processedMessages.push(line));
      });
    }

    const timestamp = new Date().getTime();

    processedMessages.forEach((message) => {
      const log = {
        msg: message,
        msg_clear: message.stripColors,
        logLevel: msg.logLevel,
        name: this.processName,
        timestamp
      };
      if(this.logs.length >= MAX_LOGS){
        this.logs.shift();
        this.removedCount++;
      }
      const id = this.logs.push(log) - 1 + this.removedCount;
      this.events.emit(`process-log-${this.processName}`, id, log);
      if (this.silent && msg.type !== 'error') {
        return;
      }
      if (this.logger[msg.type]) {
        return this.logger[msg.type](utils.normalizeInput(message));
      }
      this.logger.debug(utils.normalizeInput(message));
    });
  }
}

module.exports = LogHandler;
