import { Callback, CompilerPluginObject, Embark, EmbarkPlugins } from "embark-core";
import { __ } from "embark-i18n";
import { File, Types, dappPath } from "embark-utils";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

export default class Compiler {
  private fs: any;
  private logger: any;
  private plugins: EmbarkPlugins;

  constructor(embark: Embark, options: any) {
    this.fs = embark.fs;
    this.logger = embark.logger;
    this.plugins = options.plugins;

    embark.events.setCommandHandler("compiler:contracts:compile", this.compileContracts.bind(this));
  }

  private async runAfterActions(compiledObject: any): Promise<any> {
    return (((await promisify(this.plugins.runActionsForEvent.bind(this.plugins, "compiler:contracts:compile:after"))(compiledObject)) as unknown) as any) || {};
  }

  private async runBeforeActions(contractFiles: any[]): Promise<any[]> {
    return (((await promisify(this.plugins.runActionsForEvent.bind(this.plugins, "compiler:contracts:compile:before"))(contractFiles)) as unknown) as any[]) || [];
  }

  private *callCompilers(compilers: any, matchingFiles: any[], compilerOptions: object) {
    for (const compiler of compilers) {
      yield promisify(compiler)(matchingFiles, compilerOptions);
    }
  }

  private checkContractFiles(contractFiles: any[]) {
    const _dappPath = dappPath();
    const osTmpDir = os.tmpdir();

    return contractFiles.map((file) => {
      if (file instanceof File) {
        return file;
      }

      if (!file.path) {
        throw new TypeError("path property was missing on contract file object");
      }

      let filePath: string;
      if (!path.isAbsolute(file.path)) {
        filePath = dappPath(file.path);
      } else {
        filePath = path.normalize(file.path);
      }

      if (![_dappPath, osTmpDir].some((dir) => filePath.startsWith(dir))) {
        throw new Error("path must be within the DApp project or the OS temp directory");
      }

      return new File({
        originalPath: file.path,
        path: file.path,
        resolver: (callback: Callback<any>) => {
          this.fs.readFile(file.path, { encoding: "utf-8" }, callback);
        },
        type: Types.dappFile,
      });
    });
  }

  private async compileContracts(contractFiles: any[], cb: Callback<any>) {
    const compiledObject: { [index: string]: any } = {};
    const compilerOptions = {};

    try {
      contractFiles = this.checkContractFiles(await this.runBeforeActions(contractFiles));

      if (!contractFiles.length) {
        return cb(null, {});
      }

      await Promise.all(
        Object.entries(this.getAvailableCompilers()).map(async ([extension, compilers]: [string, any]) => {
          const matchingFiles = contractFiles.filter(this.filesMatchingExtension(extension));
          if (!matchingFiles.length) {
            return;
          }

          for await (const compileResult of this.callCompilers(compilers, matchingFiles, compilerOptions)) {
            if (compileResult === false) {
              continue;
            }
            Object.assign(compiledObject, compileResult);
            return;
          }

          throw new Error(__("No installed compiler was compatible with your version of %s files", extension));
        }),
      );

      contractFiles
        .filter((f: any) => !f.compiled)
        .forEach((file: any) => {
          this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.path));
        });

      cb(null, await this.runAfterActions(compiledObject));
    } catch (err) {
      cb(err);
    }
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
