var utils = require('../core/utils.js');
var solcProcess;
var compilerLoaded = false;

var SolcW = function() {
};

SolcW.prototype.load_compiler = function(done) {
  if (compilerLoaded) { done(); }
  solcProcess = require('child_process').fork(utils.joinPath(__dirname, '/solcP.js'));
  solcProcess.once('message', function(msg) {
    if (msg.result !== 'loadedCompiler') {
      return;
    }
    compilerLoaded = true;
    done();
  });
  solcProcess.send({action: 'loadCompiler'});
};

SolcW.prototype.isCompilerLoaded = function() {
  return (compilerLoaded === true);
};

SolcW.prototype.compile = function(obj, optimize, done) {
  solcProcess.once('message', function(msg) {
    if (msg.result !== 'compilation') {
      return;
    }
    done(msg.output);
  });
  solcProcess.send({action: 'compile', obj: obj, optimize: optimize});
};

module.exports = SolcW;

