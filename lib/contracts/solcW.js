let utils = require('../utils/utils.js');
let solcProcess;
let compilerLoaded = false;
var Npm = require('../pipeline/npm.js');
let path = require('path');
let currentSolcVersion = require('../../package.json').dependencies.solc;

class SolcW {

  constructor(options) {
    this.solcVersion = options.solcVersion;
    this.logger = options.logger;
  }

  load_compiler(done) {
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

    if (this.solcVersion === currentSolcVersion) {
      solcProcess.send({action: 'loadCompiler', solcLocation: 'solc'});
    } else {
      let npm = new Npm({logger: this.logger});
      npm.getPackageVersion('solc', this.solcVersion, false, false, function(location) {
        let requirePath = path.join(process.env.PWD, location);
        solcProcess.send({action: 'loadCompiler', solcLocation: requirePath});
      });
    }

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

