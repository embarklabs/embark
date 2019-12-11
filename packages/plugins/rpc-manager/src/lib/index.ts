import { Callback, Embark, EmbarkEvents } from "embark-core";
import { Events } from "embark-core";
import { Logger } from 'embark-logger';
import Web3 from "web3";
import EthAccounts from "./eth_accounts";
import EthSendTransaction from "./eth_sendTransaction";
import EthSignData from "./eth_signData";
import EthSignTypedData from "./eth_signTypedData";
import EthSubscribe from "./eth_subscribe";
import EthUnsubscribe from "./eth_unsubscribe";
import PersonalNewAccount from "./personal_newAccount";
import RpcModifier from "./rpcModifier";

export default class RpcManager {

  private modifiers: RpcModifier[] = [];
  private _web3: Web3 | null = null;
  private rpcModifierEvents: EmbarkEvents;
  private logger: Logger;
  private events: EmbarkEvents;
  public _accounts: any[] | null = null;
  public _nodeAccounts: any[] | null = null;
  constructor(private readonly embark: Embark) {
    this.events = embark.events;
    this.logger = embark.logger;
    this.rpcModifierEvents = new Events() as EmbarkEvents;
    this.init();
  }

  private async init() {

    this.rpcModifierEvents.setCommandHandler("nodeAccounts:updated", this.updateAccounts.bind(this));
    this.rpcModifierEvents.setCommandHandler("nodeAccounts:added", async (addedNodeAccount: any, cb: Callback<null>) => {
      if (!this._nodeAccounts) {
        this._nodeAccounts = [addedNodeAccount];
      } else {
        this._nodeAccounts.push(addedNodeAccount);
      }
      return this.updateAccounts(this._nodeAccounts, cb);
    });

    this.modifiers = [
      PersonalNewAccount,
      EthAccounts,
      EthSendTransaction,
      EthSignTypedData,
      EthSignData,
      EthSubscribe,
      EthUnsubscribe
    ].map((rpcModifier) => new rpcModifier(this.embark, this.rpcModifierEvents));
  }

  private async updateAccounts(updatedNodeAccounts: any[], cb: Callback<null>) {
    for (const modifier of this.modifiers) {
      await (modifier.nodeAccounts = Promise.resolve(updatedNodeAccounts));
    }
    cb();
  }
}
