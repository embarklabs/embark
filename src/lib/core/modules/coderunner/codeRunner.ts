// @ts-ignore
const RunCode = require("./runCode.js").default;
const Utils = require("../../../utils/utils");

const WEB3_INVALID_RESPONSE_ERROR = "Invalid JSON RPC response";

class CodeRunner {
  private config: any;
  private plugins: any;
  private logger: any;
  private events: any;
  private ipc: any;
  private commands: any;
  private runCode: any;

  constructor(options: any) {
    this.config = options.config;
    this.plugins = options.plugins;
    this.logger = options.logger;
    this.events = options.events;
    this.ipc = options.ipc;
    this.commands = [];
    this.runCode = new RunCode({logger: this.logger});
    this.registerIpcEvents();
    this.IpcClientListen();
    this.registerEvents();
    this.registerCommands();
  }

  private registerIpcEvents() {
    if (!this.ipc.isServer()) {
      return;
    }

    this.ipc.on("runcode:getCommands", (_err: any, callback: any) => {
      const result = {web3Config: this.runCode.getWeb3Config(), commands: this.commands};
      callback(null, result);
    });
  }

  private IpcClientListen() {
    if (!this.ipc.isClient() || !this.ipc.connected) {
      return;
    }

    this.ipc.listenTo("runcode:newCommand", (command: any) => {
      if (command.varName) {
        this.events.emit("runcode:register", command.varName, command.code);
      } else {
        this.events.request("runcode:eval", command.code);
      }
    });
  }

  private registerEvents() {
    this.events.on("runcode:register", this.registerVar.bind(this));
  }

  private registerCommands() {
    this.events.setCommandHandler("runcode:getContext", (cb: any) => {
      cb(this.runCode.context);
    });
    this.events.setCommandHandler("runcode:eval", this.evalCode.bind(this));
  }

  private registerVar(varName: string, code: string, toRecord = true) {
    if (this.ipc.isServer() && toRecord) {
      this.commands.push({varName, code});
      this.ipc.broadcast("runcode:newCommand", {varName, code});
    }
    this.runCode.registerVar(varName, code);
  }

  private async evalCode(code: string, cb: any, forConsoleOnly = false, tolerateError = false) {
    cb = cb || (() => {});
    const awaitIdx = code.indexOf("await");
    let awaiting = false;

    if (awaitIdx > -1) {
      awaiting = true;
      const instructions = Utils.compact(code.split(";"));
      const last = instructions.pop();

      if (!last.trim().startsWith("return")) {
        instructions.push(`return ${last}`);
      } else {
        instructions.push(last);
      }

      code = `(async function() {${instructions.join(";")}})();`;
    }
    const result = this.runCode.doEval(code, tolerateError, forConsoleOnly);

    if (forConsoleOnly && this.ipc.isServer()) {
      this.commands.push({code});
      this.ipc.broadcast("runcode:newCommand", {code});
    }

    if (!awaiting) {
      return cb(null, result);
    }

    try {
      const value = await result;
      cb(null, value);
    } catch (error) {
      // Improve error message when there"s no connection to node
      if (error.message && error.message.indexOf(WEB3_INVALID_RESPONSE_ERROR) !== -1) {
        error.message += ". Are you connected to an Ethereum node?";
      }

      cb(error);
    }
  }

}

module.exports = CodeRunner;
