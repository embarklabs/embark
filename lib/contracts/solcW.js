let utils = require('../utils/utils.js');
let solcProcess;
let compilerLoaded = false;

class SolcW {

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
    solcProcess.send({action: 'loadCompiler'});
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

