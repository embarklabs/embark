import { Embark, EmbarkEvents } /* supplied by @types/embark in packages/core/typings */ from "embark-core";
import { Logger } from "embark-logger";
import { AccountParser, dappPath } from "embark-utils";
import Web3 from "web3";

export default class RpcModifier {
  public events: EmbarkEvents;
  public logger: Logger;
  private _web3: Web3 | null = null;
  private _accounts: any[] | null = null;
  protected _nodeAccounts: any[] | null = null;
  constructor(readonly embark: Embark, readonly rpcModifierEvents: EmbarkEvents) {
    this.events = embark.events;
    this.logger = embark.logger;

    this.embark.registerActionForEvent("tests:config:updated", { priority: 40 }, async (_params, cb) => {
      // reset accounts backing variable as the accounts in config may have changed and
      // web.eth.getAccounts may return a different value now
      this._accounts = null;
      this._nodeAccounts = null;
      cb(null, null);
    });
  }

  protected get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  public get nodeAccounts() {
    return (async () => {
      if (!this._nodeAccounts) {
        const web3 = await this.web3;
        this._nodeAccounts = await web3.eth.getAccounts();
      }
      return this._nodeAccounts || [];
    })();
  }

  public set nodeAccounts(nodeAccounts: Promise<any[]>) {
    (async () => {
      this._nodeAccounts = await nodeAccounts;
      // reset accounts backing variable as it needs to be recalculated
      this._accounts = null;
    })();
  }

  protected get accounts() {
    return (async () => {
      if (!this._accounts) {
        const web3 = await this.web3;
        const nodeAccounts = await this.nodeAccounts;
        this._accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, nodeAccounts);
      }
      return this._accounts || [];
    })();
  }

  protected set accounts(accounts) {
    (async () => {
      this._accounts = await accounts;
    })();
  }
}
