const ProcessLogsApi = require('embark-process-logs-api');

const EMBARK_PROCESS_NAME = 'embark';

class ConsoleListener {
  constructor(embark, _options) {
    this.events = embark.events;
    this.processLogsApi = new ProcessLogsApi({embark: embark, processName: EMBARK_PROCESS_NAME, silent: false});

    this.events.on("log", (logLevel, message) => {
      this.processLogsApi.logHandler.handleLog({logLevel, message}, true);
    });
  }
}

module.exports = ConsoleListener;
