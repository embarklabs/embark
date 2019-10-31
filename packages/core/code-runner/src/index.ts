import { __ } from "embark-i18n";
import * as fs from "./fs";
import VM from "./vm";

export { fs, VM };

import { Callback, Embark, Events, Logger } /* supplied by @types/embark in packages/embark-typings */ from "embark";

class CodeRunner {
  private logger: Logger;
  private events: Events;
  private vm: VM;

  constructor(embark: Embark, _options: any) {
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
      cb(this.vm.options.sandbox);
    });
    this.events.setCommandHandler("runcode:eval", this.evalCode.bind(this));
  }

  private whitelistVar(varName: string, cb = () => { }) {
    // @ts-ignore
    this.vm._options.require.external.push(varName); // @ts-ignore
  }

  private registerVar(varName: string, code: any, cb = () => { }) {
    this.vm.registerVar(varName, code, cb);
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
