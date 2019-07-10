import * as fs from "./fs";
import VM from "./vm";

export { fs, VM };

import { Callback, Embark, Events, Logger } /* supplied by @types/embark in packages/embark-typings */ from "embark";

// TODO: ideally shouldn't be needed or should be done through an API
import Web3 from "web3";
const EmbarkJS = require("embarkjs");

class CodeRunner {
  private ready: boolean = false;
  private blockchainConnected: boolean = false;
  private logger: Logger;
  private events: Events;
  private vm: VM;
  private providerStates: { [key: string]: boolean } = {};
  constructor(embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;

    EmbarkJS.environment = embark.env;
    this.vm = new VM({
      require: {
        mock: {
          fs,
        },
      },
      // TODO: ideally shouldn't be needed or should be done through an API
      sandbox: {
        EmbarkJS,
        Web3,
      },
    }, this.logger);

    this.registerEvents();
    this.registerCommands();
    this.ready = true;
  }

  private registerEvents() {
    this.events.on("runcode:register", this.registerVar.bind(this));
  }

  private registerCommands() {
    this.events.setCommandHandler("runcode:getContext", (cb) => {
      cb(this.vm.options.sandbox);
    });
    this.events.setCommandHandler("runcode:eval", this.evalCode.bind(this));
  }

  private registerVar(varName: string, code: any, cb = () => { }) {
    this.vm.registerVar(varName, code, cb);
  }

  private evalCode(code: string, cb: Callback<any>, tolerateError = false) {
    cb = cb || (() => { });

    if (!code) {
      return cb(null, "");
    }

    this.vm.doEval(code, tolerateError, (err, result) => {
      if (err) {
        return cb(err);
      }

      cb(null, result);
    });
  }
}

export default CodeRunner;
