let utils = require('../../utils/utils.js');
let fs = require('../../core/fs.js');
let currentSolcVersion = require('../../../package.json').dependencies.solc;
const ProcessLauncher = require('../../process/processLauncher');

class SolcW {

  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
    this.compilerLoaded = false;
    this.solcProcess = null;
  }

  load_compiler(done) {
    const self = this;
    if (this.compilerLoaded) {
      done();
    }
    this.solcProcess = new ProcessLauncher({
      modulePath: utils.joinPath(__dirname, 'solcP.js'),
      logger: self.logger,
      events: self.events
    });
    this.solcProcess.send({action: "init", options: {}});

    this.solcProcess.on('result', 'loadedCompiler', () => {
      self.compilerLoaded = true;
      done();
    });

    this.events.request("version:get:solc", function(solcVersion) {
      if (solcVersion === currentSolcVersion) {
        self.solcProcess.send({action: 'loadCompiler', requirePath: 'solc'});
      } else {
        self.events.request("version:getPackageLocation", "solc", solcVersion, function(err, location) {
          if (err) {
            return done(err);
          }
          let requirePath = fs.dappPath(location);
          self.solcProcess.send({action: 'loadCompiler', requirePath: requirePath});
        });
      }
    });
  }

  isCompilerLoaded() {
    return (this.compilerLoaded === true);
  }

  compile(jsonObj,  done) {
    const self = this;
    this.solcProcess.on('result', 'compilation', (msg) => {
      self.solcProcess.unsubscribeTo('result', 'compilation');
      done(JSON.parse(msg.output));
    });

    this.solcProcess.send({action: 'compile', jsonObj: jsonObj});
  }
}

module.exports = SolcW;

