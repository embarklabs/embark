let utils = require('../../utils/utils.js');
let solcProcess;
let compilerLoaded = false;
let currentSolcVersion = require('../../../package.json').dependencies.solc;

class SolcW {

  constructor(options) {
    this.logger = options.logger;
    this.events = options.events;
  }

  load_compiler(done) {
    const self = this;
    if (compilerLoaded) {
      done();
    }
    solcProcess = require('child_process').fork(utils.joinPath(__dirname, '/solcP.js'));
    solcProcess.once('message', function (msg) {
      if (msg.result !== 'loadedCompiler') {
        return;
      }
      compilerLoaded = true;
      done();
    });

    this.events.request("version:get:solc", function(solcVersion) {
      self.logger.info("detected version is " + solcVersion);
      if (solcVersion === currentSolcVersion) {
        solcProcess.send({action: 'loadCompiler', solcLocation: 'solc'});
      } else {
        self.events.request("version:getPackageLocation:solc", solcVersion, function(err, location) {
          if (err) {
            return done(err);
          }
          let requirePath = utils.joinPath(process.env.PWD, location);
          solcProcess.send({action: 'loadCompiler', solcLocation: requirePath});
        });

      }
    });
  }

  isCompilerLoaded() {
    return (compilerLoaded === true);
  }

  compile(obj, optimize, done) {
    solcProcess.once('message', function (msg) {
      if (msg.result !== 'compilation') {
        return;
      }
      done(msg.output);
    });
    solcProcess.send({action: 'compile', obj: obj, optimize: optimize});
  }
}

module.exports = SolcW;

