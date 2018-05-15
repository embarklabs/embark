const constants = require('../constants');

// Override process.chdir so that we have a partial-implementation PWD for Windows
const realChdir = process.chdir;
process.chdir = (...args) => {
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }
  realChdir(...args);
};

class ProcessWrapper {
  constructor(_options) {
    this.interceptLogs();
  }

  interceptLogs() {
    const context = {};
    context.console = console;

    context.console.log = this.log.bind(this, 'log');
    context.console.warn = this.log.bind(this, 'warn');
    context.console.info = this.log.bind(this, 'info');
    context.console.debug = this.log.bind(this, 'debug');
    context.console.trace = this.log.bind(this, 'trace');
    context.console.dir = this.log.bind(this, 'dir');
  }

  log(type, ...messages) {
    if (messages[0].indexOf('hard-source')) {
      return;
    }
    process.send({result: constants.pipeline.log, message: messages, type});
  }
}

process.on('exit', () => {
  process.exit(0);
});

module.exports = ProcessWrapper;
