const vm = require("vm");
const fs = require("../../fs");

const noop = () => {};

class RunCode {
  public context: any;
  private logger: any;

  constructor({logger}: any) {
    this.logger = logger;
    const newGlobal = Object.create(global);
    newGlobal.fs = fs;
    this.context = Object.assign({}, {
       __dirname, __filename, clearInterval, clearTimeout, console, exports,
       global: newGlobal, module, process, require, setInterval, setTimeout,
    });
  }

  public doEval(code: string, tolerateError = false, forConsoleOnly = false) {
    // Check if we want this code to run on the console or by user input. If it is by
    // user input, we disallow `require` and `eval`.
    const context = (forConsoleOnly) ? this.context : Object.assign({}, this.context, {
      eval: noop, require: noop,
    });

    try {
      return vm.runInNewContext(code, context);
    } catch (e) {
      if (!tolerateError) {
        this.logger.error(e.message);
      }
      return e.message;
    }
  }

  public registerVar(varName: string, code: any) {
    // Disallow `eval` and `require`, just in case.
    if (code === eval || code === require) {
      return;
    }

    // TODO: Update all the code being dependent of web3
    // To identify, look at the top of the file for something like:
    // /*global web3*/
    if (varName === "web3") {
      // @ts-ignore
      global.web3 = code;
    }
    this.context.global[varName] = code;
    this.context[varName] = code;
  }

  public getWeb3Config() {
    const Web3 = require("web3");
    const provider = this.context.web3.currentProvider;
    let providerUrl;
    if (provider instanceof Web3.providers.HttpProvider) {
      providerUrl = provider.host;
    } else if (provider instanceof Web3.providers.WebsocketProvider) {
      providerUrl = provider.connection._url;
    }
    return {defaultAccount: this.context.web3.eth.defaultAccount, providerUrl};
  }
}

export default RunCode;
