export type Callback<Tv> = (err?: Error | null, val?: Tv) => void;

export type Maybe<T> = false | 0 | undefined | null | T;

import { ABIDefinition } from 'web3/eth/abi';

export interface Contract {
  abiDefinition: ABIDefinition[];
  deployedAddress: string;
  className: string;
  silent?: boolean;
}

export interface ContractConfig {
  address?: string;
  args?: any[];
  instanceOf?: string;
  gas?: number;
  gasPrice?: number;
  silent?: boolean;
  track?: boolean;
  deploy?: boolean;
}

export interface Plugin {
  dappGenerators: any;
  name: string;
}

export interface EmbarkPlugins {
  getPluginsFor(name: string): [Plugin];
  loadInternalPlugin(name: string, options: any): void;
  getPluginsProperty(pluginType: string, property: string, sub_property?: string): any[];
  plugins: Plugin[];
  runActionsForEvent(event: string, args: any, cb: Callback<any>): void;
}

export interface CompilerPluginObject {
  extension: string;
  cb: any;
}

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

export interface EmbarkEvents {
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

export interface EmbarkConfig {
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
    client: string;
  };
  webServerConfig: {
    certOptions: {
      key: string;
      cert: string;
    };
  };
  plugins: EmbarkPlugins;
  reloadConfig(): void;
}

type ActionCallback<T> = (params: any, cb: Callback<T>) => void;

import { Logger } from 'embark-logger';

export interface Embark {
  env: string;
  events: EmbarkEvents;
  plugins: EmbarkPlugins;
  registerAPICall(method: string, endpoint: string, cb: (...args: any[]) => void): void;
  registerConsoleCommand: any;
  logger: Logger;
  fs: any;
  config: EmbarkConfig;
  currentContext: string[];
  registerActionForEvent<T>(
    name: string,
    options?: ActionCallback<T> | { priority: number },
    action?: ActionCallback<T>,
  ): void;
}

export { ProcessLauncher } from './processes/processLauncher';
export { ProcessWrapper } from './processes/processWrapper';

export { Config } from './config';
export { IPC } from './ipc';
import { EmbarkEmitter as Events } from './events';
export { Events };
export { Plugins } from './plugins';
export { ProcessManager } from './processes/processManager';
export { ServicesMonitor } from './services_monitor';
export { TestLogger } from './utils/test_logger';
export { TemplateGenerator } from './utils/template_generator';

import * as fs from './fs';
export { fs };
