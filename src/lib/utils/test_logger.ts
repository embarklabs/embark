require("colors");

// TODO: just logFunction changes, probably doesn"t need a whole new module just
// for this
export default class TestLogger {
  private logLevels: string[];
  private logLevel: string;

  constructor(options: any) {
    this.logLevels = ["error", "warn", "info", "debug", "trace"];
    this.logLevel = options.logLevel || "info";
  }

  private logFunction(...args: any) {
    console.log(args);
  }

  public error(txt: any) {
    if (!(this.shouldLog("error"))) {
      return;
    }
    this.logFunction(txt.red);
  }

  public warn(txt: any) {
    if (!(this.shouldLog("warn"))) {
      return;
    }
    this.logFunction(txt.yellow);
  }

  public info(txt: any) {
    if (!(this.shouldLog("info"))) {
      return;
    }
    this.logFunction(txt.green);
  }

  public debug(txt: any) {
    if (!(this.shouldLog("debug"))) {
      return;
    }
    this.logFunction(txt);
  }

  public trace(txt: any) {
    if (!(this.shouldLog("trace"))) {
      return;
    }
    this.logFunction(txt);
  }

  private shouldLog(level: string) {
    return (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel));
  }

}
