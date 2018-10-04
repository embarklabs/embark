class Embark {
  constructor(embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.registerProcess();
    this.registerAPICalls();
  }

  registerProcess() {
    this.events.request('processes:register', 'embark', (setRunning) => {
      this.events.on('outputDone', setRunning);      
    });
    this.events.request('processes:launch', 'embark', () => {});
  }

  registerAPICalls(){
    this.embark.registerAPICall(
      'get',
      '/embark-api/process-logs/embark',
      (req, res) => {
        res.send(this.logger.parseLogFile());
      }
    );
  }
}

module.exports = Embark;
