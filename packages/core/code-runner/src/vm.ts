import { each } from "async";
import { Callback } from "embark-core";
import { compact, dappPath, isEs6Module, recursiveMerge } from "embark-utils";
import { Logger } from 'embark-logger';
import * as path from "path";
import { NodeVM, NodeVMOptions } from "vm2";

const WEB3_INVALID_RESPONSE_ERROR: string = "Invalid JSON RPC response";

interface Command {
  varName: string;
  code: any;
}

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
  // private _options: NodeVMOptions = {
  public _options: NodeVMOptions = {
    require: {
      builtin: ["path", "util"],
      external: [
        "@babel/runtime-corejs3/core-js/json/stringify",
        "@babel/runtime-corejs3/core-js/object/assign",
        "@babel/runtime-corejs3/core-js/promise",
        "@babel/runtime-corejs3/helpers/interopRequireDefault",
        // "embark-utils",
        // TODO: ideally this shouldnt' be needed/here or should be configurable by the modules themselves somehow
        // "embarkjs-ens",
        // "embarkjs-ipfs",
        // "embarkjs-swarm",
        // "embarkjs-whisper",
        // "eth-ens-namehash",
        // "ipfs-http-client",
        "rxjs",
        "rxjs/operators",
        // "web3",
        // "swarm-api",
      ],
    },
    sandbox: { __dirname: dappPath() },
  };

  /**
   * @constructor
   * @param {NodeVMOptions} options Options to instantiate the NodeVM with.
   * @param {Logger} logger Logger.
   */
  constructor(options: NodeVMOptions, private logger: Logger) {
    this._options = recursiveMerge(this._options, options);

    this.setupNodeVm(() => { });
  }

  public get options(): NodeVMOptions {
    return this._options;
  }

  /**
   * Transforms a snippet of code such that the last expression is returned,
   * so long as it is not an assignment.
   * @param {String} code Code to run.
   * @returns Formatted code.
   */
  private static formatCode(code: string) {
    const instructions = compact(code.split(";"));
    const last = instructions.pop().trim();
    const awaiting = code.indexOf("await") > -1;

    if (!(last.includes("return") || last.includes("="))) {
      instructions.push(`return ${last}`);
    } else {
      instructions.push(last);
    }
    code = instructions.join(";");

    return `module.exports = (${awaiting ? "async" : ""} function () {${code};})()`;
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
      return cb(e);
    }
    try {
      result = await result;
    } catch (error) {
      // Improve error message when there's no connection to node
      if (error.message && error.message.indexOf(WEB3_INVALID_RESPONSE_ERROR) !== -1) {
        error.message += ". Are you connected to an Ethereum node?";
      }
      if (typeof error === "string") {
        error = new Error(error);
      }
      return cb(error);
    }
    return cb(null, result);
  }

  /**
   * Registers a variable in the global context of the VM (called the "sandbox" in VM2 terms).
   * @param {String} varName Name of the variable to register.
   * @param {any} code Value of the variable to register.
   */
  public registerVar(varName: string, code: any, cb: Callback<null>) {
    // Disallow `eval` and `require`, just in case.
    if (code === eval || code === require) { return; }

    // handle ES6 modules
    if (isEs6Module(code) && code.default) {
      code = code.default;
    }

    this.updateState(() => {
      this._options.sandbox[varName] = code;
      this.setupNodeVm(cb);
    });
  }

  private updateState(cb: Callback<null>) {
    if (!this.vm) { return cb(); }

    // update sandbox state from VM
    each(Object.keys(this._options.sandbox), (sandboxVar: string, next: Callback<null>) => {
      this.doEval(sandboxVar, false, (err?: Error | null, result?: any) => {
        if (!err) {
          this._options.sandbox[sandboxVar] = result;
        }
        next(err);
      });
    }, cb);
  }

  /**
   * Reinstantiates the NodeVM based on the @type {VMOptions} which are passed in when this
   * @type {VM} class is instantiated. The "sandbox" member of the options can be modified
   * by calling @function {registerVar}.
   */
  private setupNodeVm(cb: Callback<null>) {
    this.vm = new NodeVM(this._options);
    cb();
  }
}

export default VM;
