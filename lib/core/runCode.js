var Web3 = require('web3');
var web3;

// ======================
// the eval is used for evaluating some of the contact calls for different purposes
// this should be at least moved to a different process and scope
// for now it is defined here
// ======================
function doEval(code, _web3) {
  if (_web3) {
    web3 = _web3;
  }
  return eval(code); // jshint ignore:line
}

module.exports = {
  doEval: doEval
};
