
var SolcW = function() {
};

SolcW.prototype.load_compiler = function(done) {
  var solc = require('solc');
  done();
  return solc;
};

module.exports = SolcW;

