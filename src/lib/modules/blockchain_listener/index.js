const ProcessLogsApi = require('../../modules/process_logs_api');

const PROCESS_NAME = 'blockchain';

/**
 * BlockchainListener has two functions:
 * 1. Register API endpoints (HTTP GET and WS) to retrieve blockchain logs
 *    when in standalone mode (ie `embark blockchain`).
 * 2. Listen to log events from the IPC connection (to `embark blockchain`) 
 *    and ensure they are processed through the LogHandler.
 */
class BlockchainListener {

  /**
   * @param {Plugin} embark Embark module plugin object
   * @param {Object} options Options object containing:
   * - {Ipc} ipc IPC started by embark (in server role) used for communication
   *         with the standalone blockchain process.
   */
  constructor(embark, {ipc}) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.ipc = ipc;
    this.processLogsApi = new ProcessLogsApi({embark: this.embark, processName: PROCESS_NAME, silent: true});

    if (this.ipc.isServer()) {
      this._listenToBlockchainLogs();
    }
  }

  /**
   * Listens to log events emitted by the standalone blockchain and ensures
   * they are processed through the LogHandler.
   * 
   * @return {void}
   */
  _listenToBlockchainLogs() {
    this.ipc.on('blockchain:log', ({logLevel, message}) => {
      this.processLogsApi.logHandler.handleLog({logLevel, message});
    });
  }
}

module.exports = BlockchainListener;
