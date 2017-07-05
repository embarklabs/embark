let utils = require('../utils/utils.js');
let solcProcess;
let compilerLoaded = false;
var npm = require('../pipeline/npm.js');
let path = require('path');

class SolcW {

  constructor(version) {
    this.solcVersion = version;
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
    npm.getPackageVersion('solc', '0.4.10', false, function(location) {
      console.log("new compiler installed at " + location);
      //let requirePath = path.join(process.env.PWD, location.substr(2));
      let requirePath = path.join(process.env.PWD, location);
      console.log(requirePath);
      solcProcess.send({action: 'loadCompiler', solcLocation: requirePath});
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

