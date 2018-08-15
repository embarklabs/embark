/*eslint no-unused-vars: off*/
let __mainContext = this;

function initContext() {
  doEval("__mainContext = this");
}

// ======================
// the eval is used for evaluating some of the contact calls for different purposes
// this should be at least moved to a different process and scope
// for now it is defined here
// ======================
function doEval(code) {
  // TODO: add trace log here
  return eval(code);
}

function registerVar(varName, code) {
  __mainContext[varName] = code;
}

function getWeb3Config() {
  return {defaultAccount:__mainContext.web3.eth.defaultAccount, provider: __mainContext.web3.currentProvider};
}

module.exports = {
  doEval,
  registerVar,
  initContext,
  getWeb3Config
};
