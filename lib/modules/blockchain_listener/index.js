const LogHandler = require('../../utils/logHandler');

const PROCESS_NAME = 'blockchain';

class BlockchainListener {
  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;
    this.ipc = options.ipc;
    this.logHandler = new LogHandler({events: this.events, logger: this.logger, processName: PROCESS_NAME, silent: true});

    if (this.ipc.isServer()) {
      this._listenToLogs();
    }

    this._registerApi();
  }

  _listenToLogs() {
    this.ipc.on('blockchain:log', ({logLevel, message}) => {
      this.logHandler.handleLog({logLevel, message});
    });
  }

  _registerApi() {
    // This route is overriden by `processLauncher` when the blockchain
    // process is launched (ie when not in blockchain standalone mode).
    // The order is determined by the order in which the engine starts
    // it's services, with `blockchain_process` coming before `web3`.
    const apiRoute = '/embark-api/process-logs/' + PROCESS_NAME;
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        this.events.on('process-log-' + PROCESS_NAME, function (id, log) {
          ws.send(JSON.stringify(Object.assign(log, {id})), () => {});
        });
      }
    );
    this.embark.registerAPICall(
      'get',
      apiRoute,
      (req, res) => {
        let limit = parseInt(req.query.limit, 10);
        if (!Number.isInteger(limit)) limit = 0;
        const result = this.logHandler.logs.map((log, id) => Object.assign(log, {id})).slice(limit);
        res.send(JSON.stringify(result));
      }
    );
  }
}

module.exports = BlockchainListener;
