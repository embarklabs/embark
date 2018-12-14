const async = require("../../utils/async_extend.js");
import { Embark } from "../../../typings/embark";
import { Plugins } from "../../../typings/plugins";

interface CompilerPluginObject {
  extension: string;
  cb: any;
}

class Compiler {
  private logger: any;
  private plugins: Plugins;
  private disableOptimizations: any;

  constructor(embark: Embark, options: any) {
    this.logger = embark.logger;
    this.plugins = options.plugins;
    this.disableOptimizations = options.disableOptimizations;

    embark.events.setCommandHandler("compiler:contracts", this.compile_contracts.bind(this));
  }

  private compile_contracts(contractFiles: any[], options: any, cb: any) {
    const available_compilers: { [index:string] : any } = {};

    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    this.plugins.getPluginsProperty("compilers", "compilers").forEach((compilerObject: CompilerPluginObject) => {
      available_compilers[compilerObject.extension] = compilerObject.cb;
    });

    const compiledObject: { [index:string] : any } = {};

    const compilerOptions = {
      disableOptimizations: this.disableOptimizations || options.disableOptimizations,
    };

    async.eachObject(available_compilers,
      (extension: string, compiler: any, callback: any) => {
        const matchingFiles = contractFiles.filter((file: any) => {
          const fileMatch = file.filename.match(/\.[0-9a-z]+$/);
          if (fileMatch && (fileMatch[0] === extension)) {
            file.compiled = true;
            return true;
          }
          return false;
        });

        if (!matchingFiles || !matchingFiles.length) {
          return callback();
        }
        compiler.call(compiler, matchingFiles, compilerOptions, (err: any, compileResult: any) => {
          Object.assign(compiledObject, compileResult);
          callback(err, compileResult);
        });
      },
      (err: any) => {
        contractFiles.forEach((file: any) => {
          if (!file.compiled) {
            this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.filename));
          }
        });

        cb(err, compiledObject);
      },
    );
  }
}

module.exports = Compiler;
