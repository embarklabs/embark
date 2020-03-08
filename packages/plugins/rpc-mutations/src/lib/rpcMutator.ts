import { Embark, EmbarkEvents } from "embark-core";
import { Logger } from "embark-logger";

export default abstract class RpcMutator {
  public events: EmbarkEvents;
  public logger: Logger;
  protected _nodeAccounts: any[] | null = null;
  constructor(readonly embark: Embark) {
    this.events = embark.events;
    this.logger = embark.logger;
  }

  public abstract async registerRpcMutations();
}
