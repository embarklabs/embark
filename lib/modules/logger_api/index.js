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
        res.send(this.logger.parseLogFile(req.query.limit));
      }
    );
  }
}

module.exports = LoggerApi;
