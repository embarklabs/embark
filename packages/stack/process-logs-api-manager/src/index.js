const {escapeHtml, LogHandler} = require('embark-utils');

// =========
// TODO: it's unclear if this is a core or stack component, there are requests from core being made to it
// we should move it to core/ but the API part should probably be a plugin instead
// =========

class ProcessLogsApiManager {
  constructor(embark) {
    this.embark = embark;
    this.logger = this.embark.logger;
    this.events = this.embark.events;

    this.processHandlers = {};

    this.events.setCommandHandler('process:logs:register', ({processName, eventName, silent, alwaysAlreadyLogged}) => {
      this.processHandlers[processName] = new LogHandler({events: this.events, logger: this.logger, processName, silent});
      this.events.on(eventName, (logLevel, message, alreadyLogged) => {
        this.processHandlers[processName].handleLog({logLevel, message}, alwaysAlreadyLogged || alreadyLogged);
      });
    });

    this.registerAPICalls();
  }

  registerAPICalls() {
    const apiRoute = '/embark-api/process-logs/:processName';
    this.embark.registerAPICall(
      'ws',
      apiRoute,
      (ws, req) => {
        const processName = req.params.processName;
        this.events.on(`process-log-${processName}`, (log) => {
          log.msg = escapeHtml(log.msg);
          log.msg_clear = escapeHtml(log.msg_clear);

          ws.send(JSON.stringify(log), () => {});
        });
      }
    );
    this.embark.registerAPICall(
      'get',
      '/embark-api/process-logs/:processName',
      (req, res) => {
        let limit = parseInt(req.query.limit, 10);
        if (!Number.isInteger(limit)) limit = 0;
        const result = this.processHandlers[req.params.processName].logs
          .slice(limit * -1)
          .map(msg => escapeHtml(msg));

        res.send(JSON.stringify(result));
      }
    );
  }
}

module.exports = ProcessLogsApiManager;
