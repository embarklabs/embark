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
      this._listenToCommands();
      this._registerConsoleCommands();
      this._registerApiEndpoint();
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

  _registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description: 'Toggles regular transactions used to prevent transactions from getting stuck when using Geth and Metamask',
      matches: ['regularTxs on', 'regularTxs off'],
      usage: "regularTxs on/off",
      process: (cmd, callback) => {
        const eventCmd = `regularTxs:${cmd.trim().endsWith('on') ? 'start' : 'stop'}`;
        this.events.request(eventCmd, callback);
      }
    });
  }

  _registerApiEndpoint() {
    this.embark.registerAPICall(
      'get',
      '/embark-api/regular-txs',
      (req, _res) => {
        this.events.request(`regularTxs:${req.query.mode === 'on' ? 'start' : 'stop'}`);
      }
    );
  }

  _listenToCommands() {

    this.events.setCommandHandler('regularTxs:start', (cb) => {
      this.events.emit('regularTxs:start');
      this.ipc.broadcast('regularTxs', 'start');
      return cb(null, 'Enabling regular transactions');
    });

    this.events.setCommandHandler('regularTxs:stop', (cb) => {
      this.events.emit('regularTxs:stop');
      this.ipc.broadcast('regularTxs', 'stop');
      return cb(null, 'Disabling regular transactions');
    });
  }
}

module.exports = BlockchainListener;
