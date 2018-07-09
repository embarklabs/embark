const Base = require('mocha/lib/reporters/base');
const ms = require('mocha/lib/ms');
const color = Base.color;

class EmbarkSpec extends Base {
  constructor(runner, options) {
    super(runner, options);

    const self = this;
    self.embarkEvents = options.reporterOptions.events;
    self.gasDetails = options.reporterOptions.gasDetails;
    self.gasLimit = options.reporterOptions.gasLimit;
    let indents = 0;
    let n = 0;
    self.stats.totalGasCost = 0;
    self.stats.test = {};
    self.stats.test.gasUsed = 0;

    function onContractReceipt(receipt) {
      const fmt = color('bright pass', ' ') +
        color('suite', ' %s') +
        color('light', ' deployed for ') +
        color(self.getGasColor(receipt.gasUsed), '%s') +
        color('light', ' gas');

      console.log(fmt, receipt.className, receipt.gasUsed);
    }

    function onBlockHeader(blockHeader) {
      self.stats.totalGasCost += blockHeader.gasUsed;
      self.stats.test.gasUsed += blockHeader.gasUsed;
    }

    if (self.gasDetails) {
      self.embarkEvents.on("deploy:contract:receipt", onContractReceipt);
    }
    self.embarkEvents.on("block:header", onBlockHeader);

    function indent() {
      return Array(indents).join('  ');
    }

    runner.on('start', function () {
      console.log();
    });

    runner.on('suite', function (suite) {
      ++indents;
      if (self.gasDetails) {
        console.log();
      }
      console.log(color('suite', '%s%s'), indent(), suite.title);
    });

    runner.on('suite end', function () {
      --indents;
      if (indents === 1) {
        console.log();
      }
    });

    runner.on('pending', function (test) {
      const fmt = indent() + color('pending', '  - %s');
      console.log(fmt, test.title);
    });


    runner.on('test', function () {
      self.stats.test.gasUsed = 0;
    });

    runner.on('pass', function (test) {
      let fmt =
        indent() +
        color('checkmark', '  ' + Base.symbols.ok) +
        color('pass', ' %s') +
        color(test.speed, ' (%dms)') +
        ' - ' +
        color(self.getGasColor(self.stats.test.gasUsed), '[%d gas]');
      console.log(fmt, test.title, test.duration, self.stats.test.gasUsed);
    });

    runner.on('fail', function (test) {
      console.log(indent() + color('fail', '  %d) %s') + ' - ' + color(self.getGasColor(self.stats.test.gasUsed), '[%d gas]'),
        ++n, test.title, self.stats.test.gasUsed);
    });

    runner.once('end', function () {
      runner.removeAllListeners();
      self.embarkEvents.removeListener("deploy:contract:receipt", onContractReceipt);
      self.embarkEvents.removeListener("block:header", onBlockHeader);
      self.epilogue();
    });
  }

  getGasColor(gasCost) {
    if (gasCost <= this.gasLimit / 10) {
      return 'fast';
    }
    if (gasCost <= 3 * (this.gasLimit / 4)) {
      return 'medium';
    }
    return 'slow';
  }

  epilogue() {
    const stats = this.stats;
    let fmt;

    console.log();

    // passes
    fmt = color('bright pass', ' ') +
      color('green', ' %d passing') +
      color('light', ' (%s)') +
      color('light', ' - [Total: %s gas]');

    console.log(fmt,
      stats.passes || 0,
      ms(stats.duration),
      stats.totalGasCost);

    // pending
    if (stats.pending) {
      fmt = color('pending', ' ') +
        color('pending', ' %d pending');

      console.log(fmt, stats.pending);
    }

    // failures
    if (stats.failures) {
      fmt = color('fail', '  %d failing');

      console.log(fmt, stats.failures);

      Base.list(this.failures);
      console.log();
    }

    console.log();
  }
}

module.exports = EmbarkSpec;
