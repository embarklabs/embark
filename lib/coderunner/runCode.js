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
  try {
    // TODO: add trace log here
    return eval(code);
  } catch(e) {
    throw new Error(e + "\n" + code);
  }
}

function registerVar(varName, code) {
  __mainContext[varName] = code;
}

module.exports = {
  doEval: doEval,
  registerVar: registerVar,
  initContext: initContext
};
