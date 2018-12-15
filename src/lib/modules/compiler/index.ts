const async = require("../../utils/async_extend.js");
import { Embark } from "../../../typings/embark";
import { CompilerPluginObject, Plugins } from "../../../typings/plugins";

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
    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    const compiledObject: {[index: string]: any} = {};

    const compilerOptions = {
      disableOptimizations: this.disableOptimizations || options.disableOptimizations,
    };

    async.eachObject(this.getAvailableCompilers(),
      (extension: string, compiler: any, next: any) => {
        const matchingFiles = contractFiles.filter(this.filesMatchingExtension(extension));
        if (matchingFiles.length === 0) {
          return next();
        }

        compiler.call(compiler, matchingFiles, compilerOptions, (err: any, compileResult: any) => {
          Object.assign(compiledObject, compileResult);
          next(err, compileResult);
        });
      },
      (err: any) => {
        contractFiles.filter((f: any) => !f.compiled).forEach((file: any) => {
          this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.filename));
        });

        cb(err, compiledObject);
      },
    );
  }

  private getAvailableCompilers() {
    const available_compilers: { [index: string]: any } = {};
    this.plugins.getPluginsProperty("compilers", "compilers").forEach((compilerObject: CompilerPluginObject) => {
      available_compilers[compilerObject.extension] = compilerObject.cb;
    });
    return available_compilers;
  }

  private filesMatchingExtension(extension: string) {
    return (file: any) => {
      const fileMatch = file.filename.match(/\.[0-9a-z]+$/);
      if (fileMatch && (fileMatch[0] === extension)) {
        file.compiled = true;
        return true;
      }
      return false;
    };
  }
}

module.exports = Compiler;
