import { Logger } from "./logger";

export interface Events {
  on: any;
  request: any;
  emit: any;
  once: any;
  setCommandHandler(name: string, callback: (options: any, cb: () => void) => void): void;
}

export interface Plugins {
  getPluginsProperty(pluginType: string, property: string, sub_property?: string): any[];
  plugins: Plugin[];
}

export interface Plugin {
  name: string;
}

export interface Embark {
  events: Events;
  registerAPICall: any;
  registerConsoleCommand: any;
  logger: Logger;
  config: {
    contractsFiles: any[];
    embarkConfig: {
      contracts: string[] | string;
      config: {
        contracts: string;
      };
    };
    reloadConfig(): void;
  };
  registerActionForEvent(name: string, action: (callback: () => void) => void): void;
}
