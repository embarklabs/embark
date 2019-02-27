const LogHandler = require('../../utils/logHandler');
const escapeHtml = require('../../utils/escapeHtml');

class ProcessLogsApi {
  constructor({embark, processName, silent}) {
    this.embark = embark;
    this.processName = processName;
    this.logger = this.embark.logger;
    this.events = this.embark.events;
    this.logHandler = new LogHandler({events: this.events, logger: this.logger, processName: this.processName, silent});

    this.registerAPICalls();
  }

  registerAPICalls() {
    const apiRoute = '/embark-api/process-logs/' + this.processName;
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, _req) => {
        this.events.on('process-log-' + this.processName, function (log) {
          log.msg = escapeHtml(log.msg);
          log.msg_clear = escapeHtml(log.msg_clear);

          ws.send(JSON.stringify(log), () => {});
        });
      }
    );
    this.embark.registerAPICall(
      'get',
      '/embark-api/process-logs/' + this.processName,
      (req, res) => {
        let limit = parseInt(req.query.limit, 10);
        if (!Number.isInteger(limit)) limit = 0;
        const result = this.logHandler.logs
          .slice(limit * -1)
          .map(msg => escapeHtml(msg));

        res.send(JSON.stringify(result));
      }
    );
  }
}

module.exports = ProcessLogsApi;
