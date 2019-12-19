import { Embark, EmbarkConfig, EmbarkEvents } /* supplied by @types/embark in packages/core/typings */ from "embark-core";
import { Logger } from "embark-logger";
import Web3 from "web3";

export default class RpcModifier {
  public events: EmbarkEvents;
  public logger: Logger;
  protected _nodeAccounts: any[] | null = null;
  constructor(readonly embark: Embark, readonly rpcModifierEvents: EmbarkEvents, public nodeAccounts: string[], public accounts: any[], protected web: Web3) {
    this.events = embark.events;
    this.logger = embark.logger;
  }
}
