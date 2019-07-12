const Mocha = require('mocha');
const {
  // EVENT_RUN_BEGIN,
  // EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS
  // EVENT_SUITE_BEGIN,
  // EVENT_SUITE_END
} = Mocha.Runner.constants;

class Reporter {
  constructor(runner, options) {
    this.runner = runner;
    this.reporter = options.reporterOptions.reporter;

    this.wireRunner();
  }

  wireRunner() {
    // let testName = '';

    this.runner
      .on(EVENT_TEST_PASS, test => {
        this.reporter.report(test.fullTitle(), true);
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        this.reporter.report(test.fullTitle(), false, err.message);
      });
  }
}

module.exports = Reporter;
