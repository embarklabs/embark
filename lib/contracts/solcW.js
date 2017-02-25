var solcProcess = require('child_process').fork(__dirname + '/solcP.js');

var SolcW = function() {
};

SolcW.prototype.load_compiler = function(done) {
  solcProcess.on('message', function(msg) {
    if (msg.result !== 'loadedCompiler') {
      return;
    }
    done();
  });
  solcProcess.send({action: 'loadCompiler'});
};

SolcW.prototype.compile = function(obj, optimize, done) {
  solcProcess.on('message', function(msg) {
    if (msg.result !== 'compilation') {
      return;
    }
    done(msg.output);
  });
  solcProcess.send({action: 'compile', obj, optimize});
};

module.exports = SolcW;

