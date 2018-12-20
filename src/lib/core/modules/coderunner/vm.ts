import { NodeVM, NodeVMOptions } from "vm2";
import { Callback } from "../../../../typings/callbacks";
import { Logger } from "../../../../typings/logger";

const fs = require("../../fs");
const { recursiveMerge } = require("../../../utils/utils");
const Utils = require("../../../utils/utils");

const WEB3_INVALID_RESPONSE_ERROR: string = "Invalid JSON RPC response";

/**
 * Wraps an instance of NodeVM from VM2 (https://github.com/patriksimek/vm2) and allows
 * code evaluations in the fully sandboxed NodeVM context.
 */
class VM {

  /**
   * The local instance of NodeVM that is wrapped
   */
  private vm!: NodeVM;

  /**
   * These external requires are the whitelisted requires allowed during evaluation
   * of code in the VM. Any other require attempts will error with "The module '<module-name>'
   * is not whitelisted in VM."
   * Currently, all of the allowed external requires appear in the EmbarkJS scripts. If
   * the requires change in any of the EmbarkJS scripts, they will need to be updated here.
   */
  private options: NodeVMOptions = {
    require: {
      builtin: ["path"],
      external: [
        "@babel/runtime-corejs2/helpers/interopRequireDefault",
        "@babel/runtime-corejs2/core-js/json/stringify",
        "@babel/runtime-corejs2/core-js/promise",
        "@babel/runtime-corejs2/core-js/object/assign",
        "eth-ens-namehash",
        "swarm-api",
      ],
    },
    sandbox: { __dirname: fs.dappPath() },
  };

  /**
   * @constructor
   * @param {NodeVMOptions} options Options to instantiate the NodeVM with.
   * @param {Logger} logger Logger.
   */
  constructor(options: NodeVMOptions, private logger: Logger) {
    this.options = recursiveMerge(this.options, options);

    this.setupNodeVm();
  }

  /**
   * Transforms a snippet of code such that the last expression is returned,
   * so long as it is not an assignment.
   * @param {String} code Code to run.
   * @returns Formatted code.
   */
  private static formatCode(code: string) {
    const instructions = Utils.compact(code.split(";"));
    const last = instructions.pop().trim();
    const awaiting = code.indexOf("await") > -1;

    if (!(last.startsWith("return") || last.indexOf("=") > -1)) {
      instructions.push(`return ${last}`);
    } else {
      instructions.push(last);
    }
    code = instructions.join(";");

    return `module.exports = (${awaiting ? "async" : ""} () => {${code};})()`;
  }

  /**
   * Evaluate a snippet of code in the VM.
   * @param {String} code Code to evaluate.
   * @param {Boolean} tolerateError If true, errors are logged to the logger (appears in the console).
   * @param {Callback<any>} cb Callback function that is called on error or completion of evaluation.
   */
  public async doEval(code: string, tolerateError = false, cb: Callback<any>) {
    code = VM.formatCode(code);

    let result: any;
    try {
      result = this.vm.run(code, __filename);
    } catch (e) {
      if (!tolerateError) {
        this.logger.error(e.message);
      }
      return cb(null, e.message);
    }
    try {
      return cb(null, await result);
    } catch (error) {
      // Improve error message when there's no connection to node
      if (error.message && error.message.indexOf(WEB3_INVALID_RESPONSE_ERROR) !== -1) {
        error.message += ". Are you connected to an Ethereum node?";
      }

      return cb(error);
    }
  }

  /**
   * Registers a variable in the global context of the VM (called the "sandbox" in VM2 terms).
   * @param {String} varName Name of the variable to register.
   * @param {any} code Value of the variable to register.
   */
  public registerVar(varName: string, code: any) {
    // Disallow `eval` and `require`, just in case.
    if (code === eval || code === require) { return; }

    this.options.sandbox[varName] = code;
    this.setupNodeVm();
  }

  /**
   * Reinstantiates the NodeVM based on the @type {VMOptions} which are passed in when this
   * @type {VM} class is instantiated. The "sandbox" member of the options can be modified
   * by calling @function {registerVar}.
   */
  private setupNodeVm() {
    this.vm = new NodeVM(this.options);
  }

  /**
   * Gets the registered @type {Web3} object, and returns an @type {object} with it's
   * defaultAccount and provider URL.
   * @typedef {getWeb3Config}
   * @property {string} defaultAccount
   * @property {string} providerUrl
   * @returns {getWeb3Config} The configured values of the web3 object registered to this
   *  VM instance.
   */
  public getWeb3Config() {
    const Web3 = require("web3");
    const provider = this.options.sandbox.web3.currentProvider;
    let providerUrl;
    if (provider instanceof Web3.providers.HttpProvider) {
      providerUrl = provider.host;
    } else if (provider instanceof Web3.providers.WebsocketProvider) {
      providerUrl = provider.connection._url;
    }
    return { defaultAccount: this.options.sandbox.web3.eth.defaultAccount, providerUrl };
  }
}

module.exports = VM;
