import rx from "rxjs";
import EventEmitter from "../lib/core/events";
import { Logger } from "./logger";

export interface Embark {
  events: EventEmitter;
  registerAPICall: any;
  registerConsoleCommand: any;
  logger: Logger;
  config: {
    embarkConfig: {
      contracts: string[] | string;
      config: {
        contracts: string;
      };
    };
  };
  registerActionForEvent(name: string, action: (callback: () => void) => void): void;
}
