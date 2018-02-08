/*eslint no-unused-vars: off*/
let Web3 = require('web3');
let web3;
let __mainContext;

// ======================
// the eval is used for evaluating some of the contact calls for different purposes
// this should be at least moved to a different process and scope
// for now it is defined here
// ======================
function doEval(code, _web3) {
  if (_web3) {
    web3 = _web3;
  }

  try {
    // TODO: add trace log here
    return eval(code);
  } catch(e) {
    throw new Error(e + "\n" + code);
  }
}

module.exports = {
  doEval: doEval
};
