import { Callback, CompilerPluginObject, Embark, Plugins /* supplied by @types/embark in packages/embark-typings */ } from "embark";
import { __ } from "embark-i18n";
import * as os from "os";
import * as path from "path";

const async = require("embark-async-wrapper");
const { File, Types, dappPath } = require("embark-utils");

class Compiler {
  private fs: any;
  private logger: any;
  private plugins: Plugins;

  constructor(embark: Embark, options: any) {
    this.fs = embark.fs;
    this.logger = embark.logger;
    this.plugins = options.plugins;

    embark.events.setCommandHandler("compiler:contracts:compile", this.compileContracts.bind(this));
  }

  private compileContracts(contractFiles: any[], cb: Callback<any>) {
    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    async.waterfall(
      [
        (next: Callback<any[]>) => {
          this.plugins.runActionsForEvent("compiler:contracts:compile:before", contractFiles, (err?: Error | null, contractFilesArr: any[] = []) => {
            if (err) {
              return next(err);
            }

            const _contractFilesArr: any[] = [];
            const _dappPath = dappPath();
            const osTmpDir = os.tmpdir();

            for (const file of contractFilesArr) {
              if (file instanceof File) {
                _contractFilesArr.push(file);
                continue;
              }

              if (!file.path) {
                err = new TypeError("path property was missing on contract file object");
                break;
              }

              let filePath: string;
              if (!path.isAbsolute(file.path)) {
                filePath = dappPath(file.path);
              } else {
                filePath = path.normalize(file.path);
              }

              if (![_dappPath, osTmpDir].some((dir) => filePath.startsWith(dir))) {
                err = new Error("path must be within the DApp project or the OS temp directory");
                break;
              }

              _contractFilesArr.push(
                new File({
                  originalPath: file.path,
                  path: file.path,
                  resolver: (callback: Callback<any>) => {
                    this.fs.readFile(file.path, { encoding: "utf-8" }, callback);
                  },
                  type: Types.dappFile,
                }),
              );
            }

            next(err || null, _contractFilesArr);
          });
        },
        (contractFilesArr: any[], next: Callback<any>) => {
          const compiledObject: { [index: string]: any } = {};

          const compilerOptions = {};

          async.eachObject(
            this.getAvailableCompilers(),
            (extension: string, compilers: any, nextObj: any) => {
              const matchingFiles = contractFilesArr.filter(this.filesMatchingExtension(extension));
              if (matchingFiles.length === 0) {
                return nextObj();
              }

              async.someLimit(
                compilers,
                1,
                (compiler: any, someCb: Callback<boolean>) => {
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
                },
                (err: Error, result: boolean) => {
                  if (err) {
                    return nextObj(err);
                  }
                  if (!result) {
                    // No compiler was compatible
                    return nextObj(new Error(__("No installed compiler was compatible with your version of %s files", extension)));
                  }
                  nextObj();
                },
              );
            },
            (err?: Error | null) => {
              if (err) {
                return next(err);
              }

              contractFilesArr
                .filter((f: any) => !f.compiled)
                .forEach((file: any) => {
                  this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.path));
                });

              next(null, compiledObject);
            },
          );
        },
        (compiledObject: any, next: Callback<any>) => {
          this.plugins.runActionsForEvent("compiler:contracts:compile:after", compiledObject, next);
        },
      ],
      (err?: Error | null, compiledObject?: any) => {
        cb(err || null, compiledObject || {});
      },
    );
  }

  private getAvailableCompilers() {
    const availableCompilers: { [index: string]: any } = {};
    this.plugins.getPluginsProperty("compilers", "compilers").forEach((compilerObject: CompilerPluginObject) => {
      if (!availableCompilers[compilerObject.extension]) {
        availableCompilers[compilerObject.extension] = [];
      }
      availableCompilers[compilerObject.extension].unshift(compilerObject.cb);
    });
    return availableCompilers;
  }

  private filesMatchingExtension(extension: string) {
    return (file: any) => {
      const fileMatch = file.path.match(/\.[0-9a-z]+$/);
      if (fileMatch && fileMatch[0] === extension) {
        file.compiled = true;
        return true;
      }
      return false;
    };
  }
}

module.exports = Compiler;
