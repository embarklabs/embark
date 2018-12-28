import async from "../../utils/async_extend.js"; // @ts-ignore
const shelljs = require("shelljs");
const path = require("path");

class Vyper {
  private logger: any;
  private events: any;
  private contractDirectories: any;

  constructor(embark: any, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.contractDirectories = embark.config.contractDirectories;

    // FIXME: Use array of extensions instead of duplicatiing
    embark.registerCompiler(".py", this.compile_vyper.bind(this));
    embark.registerCompiler(".vy", this.compile_vyper.bind(this));
  }

  private compileVyperContract(filename: any, compileABI: any, callback: any) {
    const params = compileABI ?  "-f=json " : "";
    shelljs.exec(`vyper ${params}${filename}`, {silent: true}, (code: any, stdout: any, stderr: any) => {
      if (stderr) {
        return callback(stderr);
      }
      if (code !== 0) {
        this.logger.error(stdout);
        return callback(__("Vyper exited with error code ") + code);
      }
      if (!stdout) {
        return callback(__("Execution returned no result"));
      }
      callback(null, stdout.replace(/\n/g, ""));
    });
  }

  private compile_vyper(contractFiles: any, _options: any, cb: any) {
    const self = this;
    if (!contractFiles || !contractFiles.length) {
      return cb();
    }

    const vyper = shelljs.which("vyper");
    if (!vyper) {
      self.logger.warn(__("%s is not installed on your machine", "Vyper"));
      self.logger.info(__("You can install it by visiting: %s", "https://vyper.readthedocs.io/en/latest/installing-vyper.html"));
      return cb();
    }
    self.logger.info(__("compiling Vyper contracts") + "...");

    const compiled_object: any = {};
    async.each(contractFiles,
      (file: any, fileCb: any) => {
        const className = path.basename(file.filename).split(".")[0];
        compiled_object[className] = {};
        async.parallel([
          function getByteCode(paraCb: any) {
            self.compileVyperContract(file.filename, false, (err: any, byteCode: any) => {
              if (err) {
                return paraCb(err);
              }
              compiled_object[className].runtimeBytecode = byteCode;
              compiled_object[className].realRuntimeBytecode = byteCode;
              compiled_object[className].code = byteCode;
              paraCb();
            });
          },
          function getABI(paraCb: any) {
            self.compileVyperContract(file.filename, true, (err: any, ABIString: any) => {
              if (err) {
                return paraCb(err);
              }
              let ABI = [];
              try {
                ABI = JSON.parse(ABIString);
              } catch (e) {
                return paraCb("ABI is not valid JSON");
              }
              compiled_object[className].abiDefinition = ABI;
              paraCb();
            });
          },
        ], fileCb);
      },
      (err: any) => {
        cb(err, compiled_object);
      });
  }
}

module.exports = Vyper;
