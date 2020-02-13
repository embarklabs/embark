const Mocha = require('mocha');
const {
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS
} = Mocha.Runner.constants;

class Reporter {
  constructor(runner, options) {
    this.runner = runner;
    this.reporter = options.reporterOptions.reporter;

    this.wireRunner();
  }

  wireRunner() {
    let startTime;

    this.runner
      .on(EVENT_TEST_BEGIN, _test => {
        startTime = Date.now();
      })
      .on(EVENT_TEST_PASS, test => {
        const duration = (Date.now() - startTime) / 1000.0;
        this.reporter.report(test.fullTitle(), duration, true);
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        const duration = (Date.now() - startTime) / 1000.0;
        this.reporter.report(test.fullTitle(), duration, false, err.message, err.stack);
      });
  }
}

module.exports = Reporter;
