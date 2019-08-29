import { Callback, Embark, Events, Logger } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import { __ } from "embark-i18n";
import { AccountParser, dappPath } from "embark-utils";
import Web3 from "web3";

import fundAccount from "./fundAccount";

export default class AccountsManager {
  private readonly logger: Logger;
  private readonly events: Events;
  private _web3: Web3 | null = null;
  private _accounts: any[] | null = null;

  constructor(private readonly embark: Embark, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;

    this.parseAndFundAccounts();
    this.events.on("blockchain:started", () => {
      this._web3 = null;
    });

  }

  get web3() {
    return (async () => {
      if (!this._web3) {
        const provider = await this.events.request2("blockchain:client:provider", "ethereum");
        this._web3 = new Web3(provider);
      }
      return this._web3;
    })();
  }

  get accounts() {
    return (async () => {
      if (!this._accounts) {
        const web3 = await this.web3;
        const nodeAccounts = await web3.eth.getAccounts();
        this._accounts = AccountParser.parseAccountsConfig(this.embark.config.blockchainConfig.accounts, web3, dappPath(), this.logger, nodeAccounts);
      }
      return this._accounts || [];
    })();
  }

  private async parseAndFundAccounts() {
    const web3 = await this.web3;
    const accounts = await this.accounts;

    if (!accounts.length || !this.embark.config.blockchainConfig.isDev) {
      return;
    }
    try {
      const coinbase = await web3.eth.getCoinbase();
      const fundingAccounts = accounts
        .filter((account) => account && account.address)
        .map((account) => {
          return fundAccount(web3, account.address, coinbase, account.hexBalance);
      });
      await Promise.all(fundingAccounts);
    } catch (err) {
      this.logger.error(__("Error funding accounts"), err.message || err);
    }
  }
}
