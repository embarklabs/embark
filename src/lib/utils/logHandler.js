const utils = require('./utils');

// define max number of logs to keep in memory for this process
// to prevent runaway memory leak
const MAX_LOGS = require('../constants').logs.maxLogLength;

/**
 * Serves as a central point of log handling.
 */
class LogHandler {
  
  /**
   * @param {Object} options Options object containing:
   * - {EventEmitter} events Embark events
   * - {Logger} logger Embark logger
   * - {String} processName Name of the process for which it's logs 
   *            are being handled.
   * - {Boolean} silent If true, does not log the message, unless
   *             it has a logLevel of 'error'. 
   */
  constructor({events, logger, processName, silent}) {
    this.events = events;
    this.logger = logger;
    this.processName = processName;
    this.silent = silent;

    this.logs = [];
    this.id = 0;
  }

  /**
   * Servers as an interception of logs, normalises the message output, adds
   * metadata (timestamp, id), stores the log in memory, then sends it to the 
   * logger for output. Max number of logs stored in memory is capped by MAX_LOGS.
   * 
   * @param {Object} msg Object containing the log message (msg.message)
   * @param {Boolean} alreadyLogged (optional, default = false) If true, prevents 
   * the logger from logging the event. Generally used when the log has already 
   * been logged using the Logger (which emits a "log" event), and is then sent 
   * to `handleLog` for normalization. If allowed to log again, another event 
   * would be emitted, and an infinite loop would occur. Setting to true will 
   * prevent infinite looping.
   * 
   * @returns {void} 
   */
  handleLog(msg, alreadyLogged = false) {
    if (!msg) return;

    // Sometimes messages come in with line breaks, so we need to break them up accordingly.
    let processedMessages = [];

    // Ensure that `msg.message` is an array, so we process this consistently. Sometimes it
    // is an Array, sometimes it is a string.
    if (typeof msg.message === 'string') {
      processedMessages = [msg.message];
    } else if (Array.isArray(msg.message)) {
      msg.message.forEach(message => {
        if (Array.isArray(message)) message = message.join('\n');
        let lines = message.split("\n");
        lines.forEach(line => processedMessages.push(line));
      });
    } else if (typeof msg.message === 'object') {
      processedMessages.push(JSON.stringify(msg.message));
    }

    const timestamp = new Date().getTime();

    processedMessages.forEach((message) => {
      const log = {
        msg: message,
        msg_clear: message.stripColors,
        logLevel: msg.logLevel,
        name: this.processName,
        timestamp,
        id: ++this.id
      };
      if (this.logs.length >= MAX_LOGS) {
        this.logs.shift();
      }
      this.logs.push(log);
      this.events.emit(`process-log-${this.processName}`, log);
      if ((this.silent && msg.type !== 'error') || alreadyLogged) {
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
