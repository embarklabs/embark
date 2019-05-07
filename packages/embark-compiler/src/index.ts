import {Callback, CompilerPluginObject, Embark, Plugins} /* supplied by @types/embark in packages/embark-typings */ from "embark";
import { __ } from "embark-i18n";

const async = require("embark-async-wrapper");

class Compiler {
  private logger: any;
  private plugins: Plugins;
  private isCoverage: boolean;

  constructor(embark: Embark, options: any) {
    this.logger = embark.logger;
    this.plugins = options.plugins;
    this.isCoverage = options.isCoverage;

    embark.events.setCommandHandler("compiler:contracts", this.compile_contracts.bind(this));
  }

  private compile_contracts(contractFiles: any[], cb: any) {
    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    const compiledObject: {[index: string]: any} = {};

    const compilerOptions = {
      isCoverage: this.isCoverage,
    };

    async.eachObject(this.getAvailableCompilers(),
      (extension: string, compilers: any, next: any) => {
        const matchingFiles = contractFiles.filter(this.filesMatchingExtension(extension));
        if (matchingFiles.length === 0) {
          return next();
        }

        async.someLimit(compilers, 1, (compiler: any, someCb: Callback<boolean>) => {
          compiler.call(compiler, matchingFiles, compilerOptions, (err: any, compileResult: any) => {
            if (err) {
              return someCb(err);
            }
            if (compileResult === false) {
              // Compiler not compatible, trying the next one
              return someCb(null, false);
            }
            Object.assign(compiledObject, compileResult);
            someCb(null, true);
          });
        }, (err: Error, result: boolean) => {
          if (err) {
            return next(err);
          }
          if (!result) {
            // No compiler was compatible
            return next(new Error(__("No installed compiler was compatible with your version of %s files", extension)));
          }
          next();
        });
      },
      (err: any) => {
        contractFiles.filter((f: any) => !f.compiled).forEach((file: any) => {
          this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.path));
        });

        cb(err, compiledObject);
      },
    );
  }

  private getAvailableCompilers() {
    const available_compilers: { [index: string]: any } = {};
    this.plugins.getPluginsProperty("compilers", "compilers").forEach((compilerObject: CompilerPluginObject) => {
      if (!available_compilers[compilerObject.extension]) {
        available_compilers[compilerObject.extension] = [];
      }
      available_compilers[compilerObject.extension].unshift(compilerObject.cb);
    });
    return available_compilers;
  }

  private filesMatchingExtension(extension: string) {
    return (file: any) => {
      const fileMatch = file.path.match(/\.[0-9a-z]+$/);
      if (fileMatch && (fileMatch[0] === extension)) {
        file.compiled = true;
        return true;
      }
      return false;
    };
  }
}

module.exports = Compiler;
