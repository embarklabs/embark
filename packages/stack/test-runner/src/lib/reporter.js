const chalk = require('chalk');

class Reporter {
  constructor(embark, options) {
    this.embark = embark;
    this.stdout = options.stdout || process.stdout;

    this.passes = 0;
    this.fails = 0;
    this.gasAccumulator = 0;

    this.wireGasUsage();
  }

  wireGasUsage() {
    const {events} = this.embark;
    events.on('blockchain:proxy:response', (params) => {
      const { result } = params.response;

      if (!result || !result.gasUsed) {
        return;
      }

      const gas = parseInt(result.gasUsed, 16);
      this.gasAccumulator += gas;
    });
  }

  resetGas() {
    this.gasAccumulator = 0;
  }

  header() {

  }

  footer() {
    const total = this.passes + this.fails;
    if (this.fails > 0) {
      this.stdout.write(chalk`{red Failed ${this.fails} / ${total} test(s).}\n`);
    } else {
      this.stdout.write(chalk`{green Passed ${this.passes} test(s).}\n`);

    }
  }

  report(test, time, passed, message) {
    let timeFormat = 'green';
    if (time > 0.7) {
      timeFormat = 'yellow';
    } else if(time > 1) {
      timeFormat = 'red';
    }

    const formattedGas = this.formatNumber(this.gasAccumulator);

    if (passed) {
      this.passes++;
      this.stdout.write(chalk`{bgGreen.white.bold ${' PASS '}} {underline ${test}} {bold >} {${timeFormat} ${time}s} {bold >} {bold ${formattedGas} gas}\n`);
    } else {
      this.fails++;
      this.stdout.write(chalk`{bgRed.white.bold ${' FAIL '}} {underline ${test}} {bold >} {${timeFormat} ${time}s} {bold >} {bold ${formattedGas} gas} > {red ${message || 'no error message'}}\n`);
    }

    this.resetGas();
  }

  // stolen from https://blog.abelotech.com/posts/number-currency-formatting-javascript/
  formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }
}

module.exports = Reporter;
