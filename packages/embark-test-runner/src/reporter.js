class Reporter {
  constructor() {
    this.passes = 0;
    this.fails = 0;
  }

  header() {

  }

  footer() {
    const total = this.passes + this.fails;
    if (this.fails > 0) {
      process.stdout.write(`>>> Failed ${this.fails} / ${total} test(s).\n`);
    } else {
      process.stdout.write(`>>> Passed ${this.passes} test(s).\n`);

    }
  }

  report(test, passed, message) {
    if (passed) {
      this.passes++;

      process.stdout.write(`>>> ${test} > PASS\n`);
    } else {
      this.fails++;
      process.stdout.write(`>>> ${test} > FAIL (${message || 'no error message'})\n`);
    }
  }
}

module.exports = Reporter;
