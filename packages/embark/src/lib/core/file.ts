import { __ } from "embark-i18n";
import * as path from "path";
import { ImportRemapping, prepareForCompilation } from "../utils/solidity/remapImports";

const fs = require("./fs.js");
const utils = require("../utils/utils");

export enum Types {
  embarkInternal = "embark_internal",
  dappFile = "dapp_file",
  custom = "custom",
  http = "http",
}

export class File {
  public type: Types;
  public externalUrl: string = "";
  public path: string;
  public basedir: string;
  public resolver: (callback: (content: string) => void) => void;
  public pluginPath: string;
  public storageConfig: any;
  public providerUrl: string;
  public importRemappings: ImportRemapping[] = [];
  public originalPath: string;

  constructor(options: any) {
    this.type = options.type;

    this.basedir = options.basedir || "";
    this.resolver = options.resolver;
    this.pluginPath = options.pluginPath ? options.pluginPath : "";
    this.storageConfig = options.storageConfig;
    this.providerUrl = "";
    this.originalPath = options.originalPath || "";

    if (this.type === Types.custom && this.pluginPath) {
      this.path = path.join(this.pluginPath, options.path).replace(fs.dappPath(), "");
      if (this.path.startsWith("/")) {
        this.path = this.path.substring(1);
      }
    } else if (this.type === Types.http) {
      const external = utils.getExternalContractUrl(options.externalUrl, this.providerUrl);
      this.externalUrl = external.url;
      this.path = path.normalize(fs.dappPath(external.filePath));
    } else {
      this.path = path.normalize(options.path);
    }
  }

  public async prepareForCompilation(isCoverage = false) {
    if (!this.path.endsWith(".sol")) {
      return Promise.reject(__("This method is only supported for Solidity files"));
    }
    return prepareForCompilation(this, isCoverage);
  }

  public get content(): Promise<string> {
    return new Promise<string>((resolve) => {
      switch (this.type) {
        case Types.embarkInternal: {
          const content = fs.readFileSync(fs.embarkPath(path.join("dist", this.path)), "utf-8");
          return resolve(content);
        }

        case Types.dappFile: {
          const content = fs.readFileSync(this.path, "utf-8").toString();
          return resolve(content);
        }

        case Types.custom: {
          return this.resolver((content: string) => {
            resolve(content);
          });
        }

        case Types.http: {
          fs.ensureFileSync(this.path);
          return utils.downloadFile(this.externalUrl, this.path, () => {
            const content = fs.readFileSync(this.path, "utf-8");
            resolve(content);
          });
        }
      }
    });
  }

}
