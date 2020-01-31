import { Logger } from 'embark-logger';
import { __ } from 'embark-i18n';
import * as fs from 'fs-extra';
import * as path from 'path';
import { downloadFile } from './network';
import { dappPath, embarkPath } from './pathUtils';
import { ImportRemapping, prepareForCompilation } from './solidity/remapImports';
import { cargo } from 'async';

const HTTP_CONTRACTS_DIRECTORY = '.embark/contracts/';

export enum Types {
  embarkInternal = 'embark_internal',
  dappFile = 'dapp_file',
  custom = 'custom',
  http = 'http',
}

export class File {
  public type: Types;
  public externalUrl: string = '';
  public path = '';
  public basedir: string;
  public resolver: (callback: (content: string) => void) => void;
  public pluginPath: string;
  public storageConfig: any;
  public providerUrl: string;
  public importRemappings: ImportRemapping[] = [];
  public originalPath: string;

  constructor(options: any) {
    this.type = options.type;

    this.basedir = options.basedir || '';
    this.resolver = options.resolver;
    this.pluginPath = options.pluginPath ? options.pluginPath : '';
    this.storageConfig = options.storageConfig;
    this.providerUrl = '';
    this.originalPath = options.originalPath || '';

    if (this.type === Types.custom && this.pluginPath) {
      this.path = path.join(this.pluginPath, options.path).replace(dappPath(), '');
      if (this.path.startsWith('/')) {
        this.path = this.path.substring(1);
      }
    } else if (this.type === Types.http) {
      const external = getExternalContractUrl(options.externalUrl, this.providerUrl);
      if (external !== null) {
        this.externalUrl = external.url;
        this.path = path.normalize(dappPath(external.filePath));
      }
    } else {
      this.path = path.normalize(options.path);
    }
  }

  public async prepareForCompilation(isCoverage = false) {
    if (!this.path.endsWith('.sol')) {
      return Promise.reject(__('This method is only supported for Solidity files'));
    }
    return prepareForCompilation(this, isCoverage);
  }

  public get content(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      switch (this.type) {
        case Types.embarkInternal: {
          const content = fs.readFileSync(embarkPath(path.join('dist', this.path)), 'utf-8');
          return resolve(content);
        }

        case Types.dappFile: {
          const content = fs.readFileSync(this.path, 'utf-8').toString();
          return resolve(content);
        }

        case Types.custom: {
          return this.resolver((content: string) => {
            resolve(content);
          });
        }

        case Types.http: {
          fs.ensureFileSync(this.path);
          return downloadFile(this.externalUrl, this.path, err => {
            if (err) {
              reject(err);
            }
            const content = fs.readFileSync(this.path, 'utf-8');
            resolve(content);
          });
        }
      }
    });
  }

}

export function getExternalContractUrl(file: string, providerUrl: string) {
  let url;
  const RAW_URL = 'https://raw.githubusercontent.com/';
  const DEFAULT_SWARM_GATEWAY = 'https://swarm-gateways.net/';
  const MALFORMED_SWARM_ERROR = 'Malformed Swarm gateway URL for ';
  const MALFORMED_ERROR = 'Malformed Github URL for ';
  const MALFORMED_IPFS_ERROR = 'Malformed IPFS URL for ';
  const IPFS_GETURL_NOTAVAILABLE = 'IPFS getUrl is not available. Please set it in your storage config. For more info: https://framework.embarklabs.io/docs/storage_configuration.html';
  if (file.startsWith('https://github')) {
    const file_path = file.match(/https:\/\/github\.[a-z]+\/(.*)/);
    if (!file_path) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    url = `${RAW_URL}${file_path[1].replace('blob/', '')}`;
  } else if (file.startsWith('ipfs')) {
    if (!providerUrl) {
      console.error(IPFS_GETURL_NOTAVAILABLE);
      return null;
    }
    let file_path = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)\/(.*)/);
    if (!file_path) {
      file_path = file.match(/ipfs:\/\/([-a-zA-Z0-9]+)/);
      if (!file_path) {
        console.error(MALFORMED_IPFS_ERROR + file);
        return null;
      }
    }
    let matchResult = file_path[1];
    if (file_path[2]) {
      matchResult += '/' + file_path[2];
    }
    url = `${providerUrl}${matchResult}`;
    return {
      filePath: HTTP_CONTRACTS_DIRECTORY + matchResult,
      url,
    };
  } else if (file.startsWith('git')) {
    // Match values
    // [0] entire input
    // [1] git://
    // [2] user
    // [3] repository
    // [4] path
    // [5] branch
    const file_path = file.match(
      /(git:\/\/)?github\.[a-z]+\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~#?&=]+)\/([-a-zA-Z0-9@:%_+.~?\/&=]+)#?([a-zA-Z0-9\/_.-]*)?/,
    );
    if (!file_path) {
      console.error(MALFORMED_ERROR + file);
      return null;
    }
    let branch = file_path[5];
    if (!branch) {
      branch = 'master';
    }
    url = `${RAW_URL}${file_path[2]}/${file_path[3]}/${branch}/${file_path[4]}`;
  } else if (file.startsWith('http')) {
    url = file;
  } else if (file.startsWith('bzz')) {
    if (!providerUrl) {
      url = DEFAULT_SWARM_GATEWAY + file;
    } else {
      let file_path = file.match(/bzz:\/([-a-zA-Z0-9]+)\/(.*)/);
      if (!file_path) {
        file_path = file.match(/bzz:\/([-a-zA-Z0-9]+)/);
        if (!file_path) {
          console.log(MALFORMED_SWARM_ERROR + file);
          return null;
        }
      }
      url = providerUrl + '/' + file;
    }
  } else {
    return null;
  }
  const urlToMatch = providerUrl && providerUrl.includes("localhost") ? url.replace(providerUrl, "") : url;
  const match = urlToMatch.match(
    /(?:\.[a-z]+|localhost:[0-9]+)\/([-a-zA-Z0-9@:%_+.~#?&\/=]+)/,
  );
  return {
    filePath: HTTP_CONTRACTS_DIRECTORY + (match !== null ? match[1] : ''),
    url,
  };
}

export function  getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export function getAppendLogFileCargo(logFilePath: string, logger: Logger) {
  return cargo((tasks, callback) => {
    let appendThis = '';
    tasks.forEach(task => {
      // Write each line to a JSON string. The replacer is to avoid circular dependencies
      // Add a comma at the end to be able to make an array off of it when reading
      appendThis += `${JSON.stringify(task, getCircularReplacer())},\n`;
    });
    fs.appendFile(logFilePath, appendThis, (err) => {
      if (err) {
        logger.error('Error writing to the log file', err.message);
        logger.trace(err);
      }
      callback();
    });
  });
}

export async function readAppendedLogs(logFile: string, asString: boolean = false) {
  await fs.ensureFile(logFile);
  const data = await fs.readFile(logFile);

  let stringData = data.toString();

  if (!stringData) {
    return asString ? '[]' : [];
  }

  // remove last comma and add brackets around to make it an array of object logs
  stringData = `[${stringData.substring(0, stringData.length - 2)}]`;
  if (asString) {
    return stringData;
  }

  return JSON.parse(stringData);
}
