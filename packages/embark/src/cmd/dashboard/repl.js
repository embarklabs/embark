const repl = require("repl");
const util = require("util");

class REPL {
  constructor(options) {
    this.events = options.events;
    this.env = options.env;
    this.inputStream = options.inputStream || process.stdin;
    this.outputStream = options.outputStream || process.stdout;
    this.logText = options.logText;
    this.ipc = options.ipc;
    this.logger = options.logger;
    this.useDashboard = options.useDashboard;
  }

  addHistory(cmd) {
    const history = this.replServer.history;
    if (history[0] !== cmd) {
      history.unshift(cmd);
    }
  }

  enhancedEval(cmd, context, filename, callback) {
    if (this.useDashboard) {
      this.logger.consoleOnly("console> ".cyan + cmd.white);
    }
    this.events.request('console:executeCmd', cmd.trim(), function (err, message) {
      if (err) {
        // Do not return as the first param (error), because the dashboard doesn't print errors
        return callback(null, err.message ? err.message.red : err.red);
      }
      callback(null, message === undefined ? '' : message); // This way, we don't print undefined
    });
  }

  enhancedWriter(output) {
    if ((typeof output) === "string") {
      if (this.logText) this.logText.log(output);
      return output;
    }
    const inspectedOutput = util.inspect(output, {colors: true});
    if (this.logText) this.logText.log(inspectedOutput);
    return inspectedOutput;
  }

  complete(partial, cb) {
    // no function calls
    if (partial.indexOf('(') !== -1) {
      return cb(null, [[], partial]);
    }

    const lastDot = partial.lastIndexOf('.');
    let context = partial.substr(0, lastDot);
    let hint = partial.substr(lastDot + 1);

    if (lastDot === -1) {
      context = 'this';
      hint = partial;
    }

    this.events.request('console:executePartial', context, (err, result)  => {
      if (err || !result) {
        return cb(null, [[], partial]);
      }

      let props = Object
        .getOwnPropertyNames(result)
        .sort();

      if (hint !== "") {
        props = props.filter(prop => { return prop.indexOf(hint) === 0; });
      }

      if (lastDot !== -1) {
        props = props.map(prop => { return `${context}.${prop}`; });
      }

      if (props.length > 1) {
        console.log(props.join(', '));
      }

      cb(null, [props, partial]);
    });
  }

  start(done) {
    this.replServer = repl.start({
      completer: this.complete.bind(this),
      prompt: "Embark (".cyan + this.env.green + ") > ".cyan,
      useGlobal: true,
      eval: this.enhancedEval.bind(this),
      writer: this.enhancedWriter.bind(this),
      input: this.inputStream,
      output: this.outputStream,
      terminal: true
    });

    this.events.request('console:history', (err, history) => {
      history
        .split('\n')
        .forEach((cmd) => { this.replServer.history.push(cmd); });
    });

    if (this.ipc.isServer()) {
      this.events.on('console:history:save', this.addHistory.bind(this));
    } else if (this.ipc.connected) {
      this.ipc.client.on('console:history:save', this.addHistory.bind(this));
    }

    this.events.request("runcode:getContext", (err, context) => {
      this.replServer.context = context;
    });

    this.replServer.on("exit", () => {
      process.exit(0);
    });

    done();
  }
}

module.exports = REPL;
