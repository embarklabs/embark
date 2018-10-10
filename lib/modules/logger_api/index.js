class LoggerApi {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;

    this.registerAPICalls();
  }

  registerAPICalls(){
    this.embark.registerAPICall(
      'get',
      '/embark-api/process-logs/embark',
      (req, res) => {
        let limit = parseInt(req.query.limit, 10);
        if(!Number.isInteger(limit)) limit = 0;
        res.send(this.logger.parseLogFile(limit));
      }
    );
  }
}

module.exports = LoggerApi;
