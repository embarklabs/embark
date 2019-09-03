import { Logger } from "./logger";
import { Plugins } from "./plugins";

export interface Events {
  on: any;
  request: any;
  request2: any;
  emit: any;
  once: any;
  setCommandHandler(
    name: string,
    callback: (options: any, cb: (...args: any[]) => void) => void,
  ): void;
  setCommandHandler(
    name: string,
    callback: (option: string, option2: string, cb: (...args: any[]) => void) => void,
  ): void;
}

export interface Config {
  contractsFiles: any[];
  embarkConfig: {
    contracts: string[] | string;
    config: {
      contracts: string;
    };
    versions: {
      solc: string;
    };
    generationDir: string;
  };
  blockchainConfig: {
    endpoint: string;
    accounts: any[];
    proxy: boolean;
    rpcPort: string | number;
    wsPort: string | number;
    rpcHost: string | number;
    wsHost: string | number;
    wsOrigins: string;
    rpcCorsDomain: string;
    wsRPC: boolean;
    isDev: boolean;
  };
  webServerConfig: {
    certOptions: {
      key: string;
      cert: string;
    };
  };
  plugins: Plugins;
  reloadConfig(): void;
}

export interface Embark {
  env: string;
  events: Events;
  plugins: Plugins;
  registerAPICall(method: string, endpoint: string, cb: (...args: any[]) => void): void;
  registerConsoleCommand: any;
  logger: Logger;
  fs: any;
  config: Config;
  currentContext: string[];
  registerActionForEvent(
    name: string,
    action: (params: any, cb: (error: any, result: any) => void) => void,
  ): void;
}
