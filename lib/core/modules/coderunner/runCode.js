const vm = require('vm');

class RunCode {
  constructor() {
    this.context = Object.assign({}, {global, console, exports, require, module, __filename, __dirname});
  }

  doEval(code) {
    try {
      return vm.runInNewContext(code, this.context);
    } catch(e) {
      console.log(e.message);
    }
  }

  registerVar(varName, code) {
    // TODO: Update all the code being dependent of web3
    // To identify, look at the top of the file for something like:
    // /*global web3*/
    if (varName === 'web3') {
      global.web3 = code;
    }
    this.context["global"][varName] = code;
    this.context[varName] = code;
  }

  getWeb3Config() {
    return {defaultAccount: this.context.web3.eth.defaultAccount, provider: this.context.web3.currentProvider};
  }
}

module.exports = RunCode;
