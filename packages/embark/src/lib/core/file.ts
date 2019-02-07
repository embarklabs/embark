import * as path from "path";

const fs = require("./fs.js");
const utils = require("../utils/utils");

export enum Types {
  embarkInternal = "embark_internal",
  dappFile = "dapp_file",
  custom = "custom",
  http = "http",
}

interface ImportRemapping {
  prefix: string;
  target: string;
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

    this.basedir = options.basedir;
    this.resolver = options.resolver;
    this.pluginPath = options.pluginPath ? options.pluginPath : "";
    this.storageConfig = options.storageConfig;
    this.providerUrl = "";
    this.originalPath = options.originalPath || "";

    if (this.type === Types.http) {
      const external = utils.getExternalContractUrl(options.externalUrl, this.providerUrl);
      this.externalUrl = external.url;
      this.path = external.filePath;
    } else {
      this.path = options.path.replace(/\\/g, "/");
    }
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
