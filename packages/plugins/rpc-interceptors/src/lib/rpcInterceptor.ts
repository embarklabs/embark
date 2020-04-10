import { Account, Callback, Embark, EmbarkEvents } from "embark-core";
import { Logger } from "embark-logger";
import { ProxyRequestParams, ProxyResponseParams } from "embark-proxy";
import { AccountParser, dappPath } from "embark-utils";
import Web3 from "web3";

export default abstract class RpcInterceptor {

  public events: EmbarkEvents;

  public logger: Logger;

  protected _nodeAccounts: any[] | null = null;

  protected _accounts: Account[] | null = null;

  protected _web3: Web3 | null = null;

  constructor(readonly embark: Embark) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.logger;

    this.events.setCommandHandler("rpc:accounts:reset", this.resetAccounts.bind(this));
    this.embark.registerActionForEvent("tests:config:updated", { priority: 40 }, (_params, cb) => {
      // blockchain configs may have changed (ie endpoint)
      // web.eth.getAccounts may return a different value now
      // reset accounts, so that on next request they'll be re-fetched
      this.resetAccounts(cb);
    });
  }

  protected get web3() {
    return (async () => {
      if (!this._web3) {
        await this.events.request2("blockchain:started");
        // get connection directly to the node
        const provider = await this.events.request2("blockchain:node:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
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

  protected get nodeAccounts() {
    return (async () => {
      if (!this._nodeAccounts) {
        const web3 = await this.web3;
        this._nodeAccounts = await web3.eth.getAccounts();
      }
      return this._nodeAccounts || [];
    })();
  }

  private async resetAccounts(cb: Callback<null>) {
    this._web3 = null;
    this._nodeAccounts = null;
    this._accounts = null;
    cb();
  }

  public abstract getFilter();
  public abstract async interceptRequest(params);
  public abstract async interceptResponse(params);
}
