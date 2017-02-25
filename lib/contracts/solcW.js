var solcProcess = require('child_process').fork(__dirname + '/solcP.js');
var compilerLoaded = false;

var SolcW = function() {
};

SolcW.prototype.load_compiler = function(done) {
  if (compilerLoaded) { done(); }
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
}

SolcW.prototype.compile = function(obj, optimize, done) {
  solcProcess.once('message', function(msg) {
    if (msg.result !== 'compilation') {
      return;
    }
    done(msg.output);
  });
  solcProcess.send({action: 'compile', obj, optimize});
};

module.exports = SolcW;

