import { Logger } from "./logger";

export interface CircuitsConfig {
  circuits: {
    [name: string]: {
      [key: string]: any;
    },
  };
}

export interface Events {
  on: any;
  request: any;
  emit: any;
  once: any;
  setCommandHandler: any;
}

export interface Embark {
  events: Events;
  registerAPICall: any;
  registerConsoleCommand: any;
  logger: Logger;
  config: {
    circuitsConfig: CircuitsConfig;
  };
  registerActionForEvent(name: string, action: (callback: () => void) => void): void;
}
