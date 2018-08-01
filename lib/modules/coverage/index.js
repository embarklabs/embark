class CodeCoverage {
  constructor(embark, _options) {
    this.events = embark.events;
    this.logger = embark.logger;

    embark.registerActionForEvent('contracts:deploy:afterAll', this.deployed.bind(this));
  }

  deployed(cb) {
    this.events.request('contracts:list', (error, contracts) => {
      console.dir(error);
      console.dir(contracts);
      cb();
    });
  }
}

module.exports = CodeCoverage;
