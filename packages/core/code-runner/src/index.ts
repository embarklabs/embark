import { Callback, Embark, EmbarkEvents } from "embark-core";
import { __ } from "embark-i18n";
import { Logger } from 'embark-logger';
import * as fs from "./fs";
import VM from "./vm";

export { fs, VM };

class CodeRunner {
  private logger: Logger;
  private events: EmbarkEvents;
  private vm: VM;

  constructor(private embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;

    this.vm = new VM({
      require: {
        mock: {
          fs,
        },
      },
      sandbox: {
      },
    }, this.logger);

    this.registerEvents();
    this.registerCommands();
  }

  private registerEvents() {
    // TODO: remove this on once all runcode:register have been converted to commands
    this.events.on("runcode:register", this.registerVar.bind(this));
    this.events.setCommandHandler("runcode:register", this.registerVar.bind(this));
    this.events.setCommandHandler("runcode:whitelist", this.whitelistVar.bind(this));
  }

  private registerCommands() {
    this.events.setCommandHandler("runcode:getContext", (cb) => {
      cb(null, this.vm.options.sandbox);
    });
    this.events.setCommandHandler("runcode:eval", this.evalCode.bind(this));
  }

  private whitelistVar(varName: string, cb = () => { }) {
    // @ts-ignore
    this.vm._options.require.external.push(varName); // @ts-ignore
    cb();
  }

  private registerVar(varName: string, code: any, cb = (...args) => { }) {
    this.embark.config.plugins.emitAndRunActionsForEvent<any>(`runcode:register:${varName}`, code, (err, updated) => {
      if (err) {
        return cb(err);
      }
      this.vm.registerVar(varName, updated, cb);
    });
  }

  private evalCode(code: string, cb: Callback<any>, tolerateError = false, logCode = true, logError = true) {
    cb = cb || (() => { });

    if (!code) {
      return cb(null, "");
    }

    this.vm.doEval(code, tolerateError, (err, result) => {
      if (err) {
        if (logCode) {
          this.logger.error(__("Error running code: %s", code));
        }
        if (logError) {
          this.logger.error(err.toString());
        }
        return cb(err);
      }

      cb(null, result);
    });
  }
}

export default CodeRunner;
