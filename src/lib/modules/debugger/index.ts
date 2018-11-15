import DebuggerManager from "./debugger_manager";

interface Events {
  on: any;
  request: any;
}

interface EmbarkApi {
  events: Events;
  registerAPICall: any;
  registerConsoleCommand: any;
  logger: any;
}

class TransactionDebugger {
  private embark: EmbarkApi;
  private lastTx: string;
  private debuggerManager: any;
  private txTracker: any;
  private isDebugging: boolean;
  private currentCmdTxHash: string;
  private apiDebugger: any;
  private cmdDebugger: any;
  private debuggerData: any;

  constructor(embark: EmbarkApi, options?: any) {
    this.embark = embark;

    this.debuggerManager = new DebuggerManager("http://localhost:8545");
    embark.events.on("contracts:compile:solc", this.debuggerManager.setInputJson.bind(this.debuggerManager));
    embark.events.on("contracts:compiled:solc", this.debuggerManager.setOutputJson.bind(this.debuggerManager));

    this.txTracker = {};
    this.lastTx = "";

    this.isDebugging = false;
    this.currentCmdTxHash = "";
    this.listenToEvents();
    this.listenToCommands();
    this.listentoAPI();
  }

  private listenToEvents() {
    this.embark.events.on("blockchain:tx", (tx: any) => {
      this.embark.events.request("contracts:contract", tx.name, (contract: any) => {
        this.txTracker[tx.transactionHash] = {tx, contract};
        this.lastTx = tx.transactionHash;
        if (tx.status !== "0x0") { return; }

        this.embark.logger.info("Transaction failed");

        this.debuggerManager.getLastLine(tx.transactionHash, contract.filename, (lines: string[], line: string, knownVars: any) => {
          lines.forEach((errorLine: string) => {
            this.embark.logger.error(errorLine);
          });

          this.find_vars_in_line(tx.transactionHash, line, knownVars, (foundVars: any) => {
            if (!foundVars) { return; }
            this.embark.logger.info("vars:");
            foundVars.forEach((variable: any) => {
              this.embark.logger.info(`${variable.name}: ${variable.value}`);
            });
          });
        });
      });
    });
  }

  private find_vars_in_line(txHash: string, line: string, knownVars: any, cb: any) {
    const foundVars: any = [];
    this.getGlobals(txHash, (err: any, globals: any) => {
      if (err) { return cb([]); }
      for (const variable of Object.keys(globals)) {
        const value: any = globals[variable];
        if (line.indexOf(variable) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      for (const variable of Object.keys(knownVars.locals)) {
        const value: any = knownVars.locals[variable];
        const variableName: string = variable.split(" ")[0];
        if (line.indexOf(variableName) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      for (const variable of Object.keys(knownVars.contract)) {
        const value: any = knownVars.contract[variable];
        const variableName: string = variable.split(" ")[0];
        if (line.indexOf(variableName) >= 0) {
          foundVars.push({name: variable, value});
        }
      }

      cb(foundVars);
    });
  }

  private listentoAPI() {
    this.debuggerData = {};
    this.apiDebugger = false;

    this.embark.registerAPICall("post", "/embark-api/debugger/start", (req: any, res: any) => {
      const txHash: string = req.body.params.txHash;

      this.embark.events.request("contracts:contract:byTxHash", txHash, (err: any, contract: any) => {
        if (err) {
          this.embark.logger.error(err);
          return res.send({error: err});
        }

        const filename: string = contract.filename;

        this.apiDebugger = this.debuggerManager.createDebuggerSession(txHash, filename, () => {
          this.getGlobals(txHash, (errGlobals: any, globals: any) => {
            if (errGlobals) { return res.send({ok: false}); }
            this.debuggerData.globals = globals;
            res.send({ok: true});
          });
        });
      });
    });

    this.embark.registerAPICall("post", "/embark-api/debugger/JumpBack", (req: any, res: any) => {
      this.apiDebugger.stepJumpNextBreakpoint();
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/JumpForward", (req: any, res: any) => {
      this.apiDebugger.stepJumpPreviousBreakpoint();
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/StepOverForward", (req: any, res: any) => {
      this.apiDebugger.stepOverForward(true);
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/StepOverBackward", (req: any, res: any) => {
      this.apiDebugger.stepOverBack(true);
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/StepIntoForward", (req: any, res: any) => {
      this.apiDebugger.stepIntoForward(true);
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/StepIntoBackward", (req: any, res: any) => {
      this.apiDebugger.stepIntoBack(true);
      res.send({ok: true});
    });
    this.embark.registerAPICall("post", "/embark-api/debugger/breakpoint", (req: any, res: any) => {
      res.send({ok: true});
    });

    this.embark.registerAPICall("ws", "/embark-api/debugger", (ws: any, req: any) => {
      if (!this.apiDebugger) { return; }

      this.apiDebugger.events.on("source", (lineColumnPos: any, rawLocation: any) => {
        this.debuggerData.sources = {lineColumnPos, rawLocation};
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });

      this.apiDebugger.events.on("locals", (data: any) => {
        this.debuggerData.locals = this.simplifyDebuggerVars(data);
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });

      this.apiDebugger.events.on("globals", (data: any) => {
        this.debuggerData.contract = this.simplifyDebuggerVars(data);
        ws.send(JSON.stringify(this.debuggerData), () => {});
      });
    });
  }

  private simplifyDebuggerVars(data: any) {
    const newData: any = {};

    for (const key of Object.keys(data)) {
      const field = data[key];
      newData[`${key} (${field.type})`] = field.value;
    }

    return newData;
  }

  private listenToCommands() {
    this.cmdDebugger = false;
    this.currentCmdTxHash = "";

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      const cmdName = cmd.split(" ")[0];
      const txHash = cmd.split(" ")[1];
      return {
        match: () => cmdName === "debug",
        process: (cb: any) => {
          if (txHash) {
            this.embark.events.request("contracts:contract:byTxHash", txHash, (err: any, contract: any) => {
              if (err) {
                this.embark.logger.error(err);
                return;
              }
              this.currentCmdTxHash = txHash;
              this.embark.logger.info("debugging tx " + txHash);
              this.cmdDebugger = this.debuggerManager.createDebuggerSession(txHash, contract.filename, () => {
                this.cmdDebugger.getSource().forEach((line: string) => {
                  this.embark.logger.info(line);
                });
              });
            });
            return;
          }
          this.currentCmdTxHash = this.lastTx;
          const filename: string = this.txTracker[this.lastTx].contract.filename;
          this.embark.logger.info("debugging tx " + this.lastTx);
          this.cmdDebugger = this.debuggerManager.createDebuggerSession(this.lastTx, filename, () => {
            this.cmdDebugger.getSource().forEach((line: string) => {
              this.embark.logger.info(line);
            });
          });
        },
      };
    });

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      return {
        match: () => (cmd === "next" || cmd === "n"),
        process: (cb: any) => {
          if (!this.cmdDebugger.currentStep()) {
            this.embark.logger.info("end of execution reached");
            return this.cmdDebugger.unload();
          }
          this.cmdDebugger.stepOverForward(true);
          this.cmdDebugger.getSource().forEach((line: string) => {
            this.embark.logger.info(line);
          });
        },
      };
    });

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      return {
        match: () => (cmd === "previous" || cmd === "p"),
        process: (cb: any) => {
          if (!this.cmdDebugger.currentStep()) {
            this.embark.logger.info("end of execution reached");
            return this.cmdDebugger.unload();
          }
          this.cmdDebugger.stepOverBack(true);
          this.cmdDebugger.getSource().forEach((line: string) => {
            this.embark.logger.info(line);
          });
        },
      };
    });

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      return {
        match: () => (cmd === "var local" || cmd === "v l" || cmd === "vl"),
        process: (cb: any) => {
          this.cmdDebugger.displayLocals();
        },
      };
    });

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      return {
        match: () => (cmd === "var global" || cmd === "v g" || cmd === "vg"),
        process: (cb: any) => {
          this.cmdDebugger.displayGlobals();
        },
      };
    });

    this.embark.registerConsoleCommand((cmd: string, options: any) => {
      return {
        match: () => (cmd === "var all" || cmd === "v a" || cmd === "va"),
        process: (cb: any) => {
          this.getGlobals(this.currentCmdTxHash, (err: any, globals: any) => {
            if (err) { return this.embark.logger.error(err); }
            this.embark.logger.info(globals);
          });
        },
      };
    });
  }

  private getGlobals(txHash: string, cb: any) {
    const globals: any = {};
    this.embark.events.request("blockchain:getTransaction", txHash, (err: any, tx: any) => {
      if (err) { return cb(err); }

      this.embark.events.request("blockchain:block:byHash", tx.blockHash, (errHash: any, block: any) => {
        if (errHash) { return cb(errHash); }

        /* tslint:disable:no-string-literal */
        globals["block.blockHash"] = tx.blockHash;
        globals["block.number"] = tx.blockNumber;
        globals["block.coinbase"] = block.miner;
        globals["block.difficulty"] = block.difficulty;
        globals["block.gaslimit"] = block.gasLimit;
        globals["block.timestamp"] = block.timestamp;
        globals["msg.sender"] = tx.from;
        globals["msg.gas"] = tx.gas;
        globals["msg.gasPrice"] = tx.gasPrice;
        globals["msg.value"] = tx.value;
        globals["now"] = block.timestamp;
        /* tslint:enable:no-string-literal */

        cb(null, globals);
      });
    });
  }

}

module.exports = TransactionDebugger;
