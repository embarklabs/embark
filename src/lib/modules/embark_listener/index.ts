const ProcessLogsApi = require("../process_logs_api");

const EMBARK_PROCESS_NAME = "embark";

/**
 * EmbarkListener has two functions:
 * 1. Register API endpoints (HTTP GET and WS) to retrieve embark logs.
 * 2. Listen to log events in Embark and ensure they are processed
 *    through the LogHandler.
 */
class EmbarkListener {
  private embark: any;
  private events: any;
  private logger: any;
  private processLogsApi: any;

  /**
   * @param {Plugin} embark EmbarkListener module plugin object
   */
  constructor(embark: any) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.processLogsApi = new ProcessLogsApi({embark: this.embark, processName: EMBARK_PROCESS_NAME, silent: false});

    this._listenToEmbarkLogs();
  }

  /**
   * Listens to log events emitted by the Embark application and ensures
   * they are processed through the LogHandler.
   *
   * @return {void}
   */
  private _listenToEmbarkLogs() {
    this.events.on("log", (logLevel: any, message: any) => {
      this.processLogsApi.logHandler.handleLog({logLevel, message}, true);
    });
  }
}

export default EmbarkListener;
