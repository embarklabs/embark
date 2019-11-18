import { Logger } from './logger';
import { Plugins } from './plugins';
import { Callback } from './callbacks';

type CommandCallback = (
  opt1?: any,
  opt2?: any,
  opt3?: any,
  opt4?: any,
  opt5?: any,
  opt6?: any,
  opt7?: any,
  opt8?: any,
  opt9?: any,
  opt10?: any,
  opt11?: any,
  opt12?: any,
) => any;

export interface Events {
  on: any;
  request: any;
  request2: any;
  emit: any;
  once: any;
  setCommandHandler(
    name: string,
    callback: CommandCallback,
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

type ActionCallback<T> = (params: any, cb: Callback<T>) => void;

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
  registerActionForEvent<T>(
    name: string,
    options?: ActionCallback<T> | { priority: number },
    action?: ActionCallback<T>,
  ): void;
}
